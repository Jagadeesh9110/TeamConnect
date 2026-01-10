import { Server, Socket } from "socket.io";
import jwt from 'jsonwebtoken';

interface SocketUser {
    userId: string;
    email: string;
}

export const setupSocket = (io: Server) => {
    // Authenticate socket connection
    io.use((socket: Socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Authentication error"));
            }

            if (!process.env.JWT_SECRET) {
                throw new Error("JWT_SECRET not defined");
            }

            const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as SocketUser;
            socket.data.user = decodedToken;
            next();

        } catch {
            return next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket: Socket) => {
        const user = socket.data.user as SocketUser;
        if (!user) {
            return socket.disconnect();
        }
        console.log("Socket connected:", user.userId);

        // Join a conversation room
        socket.on("join_conversation", (conversationId: string) => {
            if (!conversationId) return;

            socket.join(conversationId);
            console.log(
                `User ${user.userId} joined room ${conversationId}`
            );
        });

        // Real-time message broadcasting
        socket.on("send_message", (data) => {
            const { conversationId, message } = data;

            if (!conversationId || !message) return;

            // Broadcast to all users in the conversation room
            socket.to(conversationId).emit("receive_message", {
                conversationId,
                message,
            });
        });

        // Typing indicators
        socket.on("typing_start", (conversationId: string) => {
            if (!conversationId) return;

            socket.to(conversationId).emit("user_typing", {
                conversationId,
                userId: user.userId,
                isTyping: true,
            });
        });

        socket.on("typing_stop", (conversationId: string) => {
            if (!conversationId) return;

            socket.to(conversationId).emit("user_typing", {
                conversationId,
                userId: user.userId,
                isTyping: false,
            });
        });


        socket.on("disconnect", () => {
            console.log("Socket disconnected:", user.userId);
        });
    })


}