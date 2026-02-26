import { Router } from "express";
import { createWorkspace, getUserWorkspaces,getWorkspaceDetails,addMemberToWorkspace,removeMemberFromWorkspace,deleteWorkspace, getWorkspaceMembers } from "../controllers/workspace.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router= Router();

// Create a new workspace
router.post("/", authMiddleware, createWorkspace);

// Get all workspaces for the authenticated user
router.get("/", authMiddleware, getUserWorkspaces);

// Get details of a specific workspace
router.get("/:workspaceId", authMiddleware, getWorkspaceDetails);

// get workspace members
router.get("/:workspaceId/members", authMiddleware, getWorkspaceMembers);

// Add a member to the workspace
router.post("/:workspaceId/members", authMiddleware, addMemberToWorkspace);

// Remove a member from the workspace
router.delete("/:workspaceId/members/:userId", authMiddleware, removeMemberFromWorkspace);

// Delete a workspace
router.delete("/:workspaceId", authMiddleware, deleteWorkspace);


export default router;