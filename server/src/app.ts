import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import authRoutes from "./routes/auth.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";

const app = express();
 
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

app.get("/health", (_, res) => {
    res.status(200).json({ status: "OK", service: "TeamConnect Backend" });
});

// app.use("/api/conversations", conversationRoutes);
// app.use("/api/messages", messageRoutes);

export default app;