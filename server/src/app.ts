import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/health", (_, res) => {
    res.status(200).json({ status: "OK", service: "TeamConnect Backend" });
});

export default app;