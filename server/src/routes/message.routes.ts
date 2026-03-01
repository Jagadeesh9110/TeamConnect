import { Router } from "express";
import { sendMessage, getConversationMessages, editMessage, softDeleteMessage } from "../controllers/message.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Send a message
router.post("/", authMiddleware, sendMessage);

// Get messages for a conversation
router.get("/:conversationId/messages", authMiddleware, getConversationMessages);

// Edit a message
router.patch("/:messageId", authMiddleware, editMessage);

// Soft-delete a message
router.delete("/:messageId", authMiddleware, softDeleteMessage);

export default router;