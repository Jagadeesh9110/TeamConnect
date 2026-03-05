import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

/* ── Types ──────────────────────────────────────────────────────────── */

interface JwtPayload {
    userId: string;
    email: string;
    tokenVersion: number;
}

interface AuthenticatedSocket extends Socket {
    userId: string;
    email: string;
}

/* ── State ──────────────────────────────────────────────────────────── */

let io: Server | null = null;

// Multi-tab presence: userId → Set of socketIds
const userSockets = new Map<string, Set<string>>();

/* ── Init ───────────────────────────────────────────────────────────── */

export const initSocket = (httpServer: HttpServer): Server => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            credentials: true,
        },
    });

    /* ── JWT Auth Middleware ──────────────────────────────────────── */
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        try {
            const decoded = jwt.verify(
                token,
                process.env.ACCESS_TOKEN_SECRET as string
            ) as JwtPayload;

            (socket as AuthenticatedSocket).userId = decoded.userId;
            (socket as AuthenticatedSocket).email = decoded.email;
            next();
        } catch {
            return next(new Error("Invalid or expired token"));
        }
    });

    /* ── Connection Handler ──────────────────────────────────────── */
    io.on("connection", async (rawSocket: Socket) => {
        const socket = rawSocket as AuthenticatedSocket;
        const { userId } = socket;

        console.info(`[SOCKET] Connected: ${userId} (${socket.id})`);

        // Track multi-tab presence
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket.id);

        // First socket for this user → mark online
        if (userSockets.get(userId)!.size === 1) {
            await prisma.user.update({
                where: { id: userId },
                data: { isOnline: true },
            });

            // Get user's workspaces and broadcast presence
            const memberships = await prisma.workspaceMember.findMany({
                where: { userId },
                select: { workspaceId: true },
            });

            for (const m of memberships) {
                io!.to(`workspace:${m.workspaceId}`).emit("presence:update", {
                    userId,
                    isOnline: true,
                });
            }
        }

        /* ── Room: Join Workspace ────────────────────────────────── */
        socket.on("workspace:join", async (workspaceId: string) => {
            // Verify membership
            const membership = await prisma.workspaceMember.findUnique({
                where: { workspaceId_userId: { workspaceId, userId } },
            });

            if (!membership) {
                socket.emit("error", { message: "Not a member of this workspace" });
                return;
            }

            socket.join(`workspace:${workspaceId}`);
            console.info(`[SOCKET] ${userId} joined workspace:${workspaceId}`);
        });

        /* ── Room: Join Conversation ─────────────────────────────── */
        socket.on("conversation:join", async (conversationId: string) => {
            // Verify participant
            const participant = await prisma.participant.findFirst({
                where: { conversationId, userId },
            });

            if (!participant) {
                socket.emit("error", { message: "Not a participant in this conversation" });
                return;
            }

            socket.join(`conversation:${conversationId}`);
        });

        /* ── Room: Leave Conversation ────────────────────────────── */
        socket.on("conversation:leave", (conversationId: string) => {
            socket.leave(`conversation:${conversationId}`);
        });

        /* ── Typing Indicators ───────────────────────────────────── */
        socket.on("typing:start", (conversationId: string) => {
            socket.to(`conversation:${conversationId}`).emit("typing:start", {
                userId,
                conversationId,
            });
        });

        socket.on("typing:stop", (conversationId: string) => {
            socket.to(`conversation:${conversationId}`).emit("typing:stop", {
                userId,
                conversationId,
            });
        });

        /* ── Disconnect ──────────────────────────────────────────── */
        socket.on("disconnect", async () => {
            console.info(`[SOCKET] Disconnected: ${userId} (${socket.id})`);

            // Remove this socket from tracking
            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket.id);

                // Last socket disconnected → user goes offline
                if (sockets.size === 0) {
                    userSockets.delete(userId);

                    await prisma.user.update({
                        where: { id: userId },
                        data: { isOnline: false, lastSeenAt: new Date() },
                    });

                    // Broadcast offline to all workspaces
                    const memberships = await prisma.workspaceMember.findMany({
                        where: { userId },
                        select: { workspaceId: true },
                    });

                    for (const m of memberships) {
                        io!.to(`workspace:${m.workspaceId}`).emit("presence:update", {
                            userId,
                            isOnline: false,
                            lastSeenAt: new Date().toISOString(),
                        });
                    }
                }
            }
        });
    });

    console.info("✅ Socket.IO initialized");
    return io;
};

/* ── Getter for controllers ──────────────────────────────────────── */

export const getIO = (): Server => {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call initSocket() first.");
    }
    return io;
};
