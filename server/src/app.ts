import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => {
    res.status(200).json({ status: "OK", service: "TeamConnect Backend" });
});

export default app;