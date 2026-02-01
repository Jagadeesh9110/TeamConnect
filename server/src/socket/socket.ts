// import { Server, Socket } from "socket.io";
// import jwt from 'jsonwebtoken';
// import Message from "../models/Message";
// import Conversation from "../models/Conversation";
// import mongoose from "mongoose";

// interface SocketUser {
//     userId: string;
//     email: string;
// }

// const onlineUsers = new Map<string, string>();

// export const setupSocket = (io: Server) => {
//     // Authenticate socket connection
//     io.use((socket: Socket, next) => {
//         try {
//             const token = socket.handshake.auth.token;
//             if (!token) {
//                 return next(new Error("Authentication error"));
//             }

//             if (!process.env.JWT_SECRET) {
//                 throw new Error("JWT_SECRET not defined");
//             }

//             const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as SocketUser;
//             socket.data.user = decodedToken;
//             next();

//         } catch {
//             return next(new Error("Authentication error"));
//         }
//     });

//     io.on("connection", (socket: Socket) => {
//         const user = socket.data.user as SocketUser;
//         if (!user) {
//             return socket.disconnect();
//         }
//         console.log("Socket connected:", user.userId);

//         onlineUsers.set(user.userId, socket.id);
//         console.log("Online users:", onlineUsers.size);

//         // Join a conversation room
//         socket.on("join_conversation", (conversationId: string) => {
//             if (!conversationId) return;

//             socket.join(conversationId);

//             // Notify others in the room
//             socket.to(conversationId).emit("user_online", {
//                 userId: user.userId,
//             });


//             console.log(
//                 `User ${user.userId} joined room ${conversationId}`
//             );
//         });

//         // Real-time message broadcasting
//         socket.on("send_message", async (data) => {
//             try {
//                 const { conversationId, content } = data;
//                 const userId = user.userId;

//                 if (!conversationId || !content) return;

//                 const message = await Message.create({
//                     conversationId: new mongoose.Types.ObjectId(conversationId),
//                     senderId: new mongoose.Types.ObjectId(userId),
//                     content,
//                     status: "sent",
//                 });

//                 await Conversation.findByIdAndUpdate(conversationId, {
//                     lastMessageAt: new Date(),
//                 });

//                 io.to(conversationId).emit("receive_message", {
//                     conversationId,
//                     message,
//                 });

//             } catch (err) {
//                 console.error("Socket send_message error", err);
//             }
//         });

//         // Typing indicators
//         socket.on("typing_start", (conversationId: string) => {
//             if (!conversationId) return;

//             socket.to(conversationId).emit("user_typing", {
//                 conversationId,
//                 userId: user.userId,
//                 isTyping: true,
//             });
//         });

//         socket.on("typing_stop", (conversationId: string) => {
//             if (!conversationId) return;

//             socket.to(conversationId).emit("user_typing", {
//                 conversationId,
//                 userId: user.userId,
//                 isTyping: false,
//             });
//         });


//         socket.on("disconnect", () => {
//             onlineUsers.delete(user.userId);
//             console.log("Socket disconnected:", user.userId);

//             console.log("Online users:", onlineUsers.size);

//             // Notify all rooms this socket was part of
//             socket.rooms.forEach((roomId) => {
//                 if (roomId !== socket.id) {
//                     socket.to(roomId).emit("user_offline", {
//                         userId: user.userId,
//                     });
//                 }
//             });
//         });
//     })


// }