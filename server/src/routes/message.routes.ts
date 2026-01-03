import { Router } from 'express';
import { authMiddleware } from "../middleware/auth.middleware";
import { fetchMessages, sendMessage } from "../controllers/message.controller";

const router = Router();

router.post("/", authMiddleware, sendMessage);
router.get("/:conversationId", authMiddleware, fetchMessages);

export default router;
