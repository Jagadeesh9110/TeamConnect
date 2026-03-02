import { Router } from "express";
import { validateInvite, acceptInvite } from "../controllers/workspaceInvite.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Validate invite token — PUBLIC (user may not be logged in)
router.get("/:token", validateInvite);

// Accept invite — requires auth
router.post("/accept", authMiddleware, acceptInvite);

export default router;
