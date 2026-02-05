import {Router} from "express";
import { sendMessage,getConversationMessages } from "../controllers/message.controller.js";
import  {authMiddleware}  from "../middleware/auth.middleware.js";

const router=Router();


router.post("/", authMiddleware, sendMessage);

router.get("/:conversationId/messages", authMiddleware, getConversationMessages);

export default router;