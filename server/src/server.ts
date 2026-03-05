import http from "http";
import app from "./app.js";
import dotenv from "dotenv";
import { initSocket } from "./socket/socket.server.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

// Create HTTP server from Express app
const httpServer = http.createServer(app);

// Initialize Socket.IO on the HTTP server
initSocket(httpServer);

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
