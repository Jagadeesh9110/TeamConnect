import app from "./app";
import connectDB from "./config/dbConnect";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        server.on("error", (err: any) => {
            console.error("Server failed to start:", err.message);
            process.exit(1);
        });
    } catch (error) {
        console.error("Startup error:", error);
        process.exit(1);
    }
};

startServer();
