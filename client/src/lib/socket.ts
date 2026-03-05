import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

let socket: Socket | null = null;

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const connectSocket = (): Socket | null => {
    if (socket?.connected) return socket;

    // Read token from Zustand store (same pattern as apiClient)
    const token = useAuthStore.getState().accessToken;
    if (!token) return null;

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
        console.info("✅ Socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
        console.info("❌ Socket disconnected:", reason);
    });

    // Refresh token before each reconnect attempt
    socket.io.on("reconnect_attempt", () => {
        const freshToken = useAuthStore.getState().accessToken;
        if (freshToken && socket) {
            socket.auth = { token: freshToken };
        }
    });

    socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
    });

    socket.on("error", (data: { message: string }) => {
        console.warn("Socket server error:", data.message);
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = (): Socket | null => socket;

/* ── Room helpers ───────────────────────────────────────────────── */

export const joinWorkspace = (workspaceId: string) => {
    socket?.emit("workspace:join", workspaceId);
};

export const joinConversation = (conversationId: string) => {
    socket?.emit("conversation:join", conversationId);
};

export const leaveConversation = (conversationId: string) => {
    socket?.emit("conversation:leave", conversationId);
};

/* ── Typing helpers ─────────────────────────────────────────────── */

export const emitTypingStart = (conversationId: string) => {
    socket?.emit("typing:start", conversationId);
};

export const emitTypingStop = (conversationId: string) => {
    socket?.emit("typing:stop", conversationId);
};
