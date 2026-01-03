import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import conversationRoutes from "./routes/conversation.routes";
import messageRoutes from "./routes/message.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/conversations", conversationRoutes);
app.use("/messages", messageRoutes);

app.get("/health", (_, res) => {
    res.status(200).json({ status: "OK", service: "TeamConnect Backend" });
});

export default app;