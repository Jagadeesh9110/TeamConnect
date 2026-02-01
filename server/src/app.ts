import express from "express";
import cors from "cors";
// import authRoutes from "./routes/auth.routes";
// import conversationRoutes from "./routes/conversation.routes";
// import messageRoutes from "./routes/message.routes";

const app = express();

app.use(cors());
app.use(express.json());

// app.use("/api/auth", authRoutes);

app.get("/health", (_, res) => {
    res.status(200).json({ status: "OK", service: "TeamConnect Backend" });
});

// app.use("/api/conversations", conversationRoutes);
// app.use("/api/messages", messageRoutes);

export default app;