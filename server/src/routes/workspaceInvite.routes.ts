import { Router } from "express";
import { validateInvite, acceptInvite, revokeInvite } from "../controllers/workspaceInvite.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Validate invite token — PUBLIC (user may not be logged in)
router.get("/:token", validateInvite);

// Accept invite — requires auth
router.post("/accept", authMiddleware, acceptInvite);

// Revoke invite — requires auth (owner-only)
router.delete("/:inviteId", authMiddleware, revokeInvite);

export default router;
