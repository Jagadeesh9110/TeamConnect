import "./config/env.js";
import http from "http";
import app from "./app.js";
import { initSocket } from "./socket/socket.server.js";

const PORT = Number(process.env.PORT) || 5000;

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});