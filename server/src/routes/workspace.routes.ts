import { Router } from "express";
import { createWorkspace, getUserWorkspaces, getWorkspaceDetails, inviteMemberByEmail, removeMemberFromWorkspace, deleteWorkspace, getWorkspaceMembers } from "../controllers/workspace.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Create a new workspace
router.post("/", authMiddleware, createWorkspace);

// Get all workspaces for the authenticated user
router.get("/", authMiddleware, getUserWorkspaces);

// Get details of a specific workspace
router.get("/:workspaceId", authMiddleware, getWorkspaceDetails);

// get workspace members
router.get("/:workspaceId/members", authMiddleware, getWorkspaceMembers);

// Invite member by email
router.post("/:workspaceId/invite", authMiddleware, inviteMemberByEmail);

// Remove a member from the workspace
router.delete("/:workspaceId/members/:userId", authMiddleware, removeMemberFromWorkspace);

// Delete a workspace
router.delete("/:workspaceId", authMiddleware, deleteWorkspace);


export default router;