import {Router} from "express";
import { createPrivateConversation, getUserConversations } from "../controllers/conversation.controller.js";
import  {authMiddleware}  from "../middleware/auth.middleware.js";

const router=Router();

// Create a private conversation between two users
router.post("/private", authMiddleware, createPrivateConversation);

// Get all conversations for the authenticated user
router.get("/", authMiddleware, getUserConversations);

export default router;