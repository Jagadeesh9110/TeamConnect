import { Router } from "express";
import {
    createActionItem,
    getActionItems,
    updateActionItem,
    deleteActionItem,
} from "../controllers/actionItem.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Conversation-scoped
router.post("/conversations/:conversationId/action-items", authMiddleware, createActionItem);
router.get("/conversations/:conversationId/action-items", authMiddleware, getActionItems);

// Action item-scoped
router.patch("/action-items/:actionItemId", authMiddleware, updateActionItem);
router.delete("/action-items/:actionItemId", authMiddleware, deleteActionItem);

export default router;
