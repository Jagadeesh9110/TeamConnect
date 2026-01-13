import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const connectSocket = (): Socket | null => {
    if (socket) return socket;

    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
    });

    socket.on("connect", () => {
        console.log("✅ Socket connected:", socket?.id);
    });

    socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;
