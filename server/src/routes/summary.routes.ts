import { Router } from "express";
import {
    summarizeConversation,
    getConversationSummary,
} from "../controllers/summary.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Generate summary
router.post("/conversations/:conversationId/summarize", authMiddleware, summarizeConversation);

// Get latest summary
router.get("/conversations/:conversationId/summary", authMiddleware, getConversationSummary);

export default router;
