import { Router } from "express";
import {
    createDecision,
    getDecisions,
    deleteDecision,
} from "../controllers/decision.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Conversation-scoped
router.post("/conversations/:conversationId/decisions", authMiddleware, createDecision);
router.get("/conversations/:conversationId/decisions", authMiddleware, getDecisions);

// Decision-scoped
router.delete("/decisions/:decisionId", authMiddleware, deleteDecision);

export default router;
