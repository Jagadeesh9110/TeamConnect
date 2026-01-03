import { Router } from "express";
import { createPrivateConversation, getAllConversations } from "../controllers/conversation.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/private", authMiddleware, createPrivateConversation);
router.get("/", authMiddleware, getAllConversations);

export default router;