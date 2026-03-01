import { Router } from "express";
import { createPrivateConversation, getUserConversations, createGroupConversation, udpateConversationTitle } from "../controllers/conversation.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Create a private conversation between two users
router.post("/private", authMiddleware, createPrivateConversation);

// Create a group conversation
router.post("/group", authMiddleware, createGroupConversation);

// Get all conversations for the authenticated user
router.get("/", authMiddleware, getUserConversations);

//patch update conversation title 
router.patch("/:conversationId/title", authMiddleware, udpateConversationTitle)

export default router;