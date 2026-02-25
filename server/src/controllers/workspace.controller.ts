import { Response } from "express";
import prisma from "../config/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { WorkspaceRole } from "../generated/prisma/enums.js";


// create a workspace 
export const createWorkspace = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { name } = req.body;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        if (!name) {
            return res.status(400).json({
                success: false,
                error: "Workspace name is required"
            });
        }

        // Prevent duplicates per user
        const existingWorkspace = await prisma.workspace.findFirst({
            where: {
                name,
                createdById: currentUserId
            }
        });

        if (existingWorkspace) {
            return res.status(409).json({
                success: false,
                error: "Workspace with this name and user created already exists"
            });
        }

        const workspace = await prisma.workspace.create({
            data: {
                name,
                createdById: currentUserId,
                members: {
                    create: {
                        userId: currentUserId,
                        role: WorkspaceRole.OWNER
                    }
                }
            }
            , include: {
                members: true
            }
        })

        return res.status(201).json({
            success: true,
            data: {
                message: "Workspace created successfully",
                workspace
            }
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            error: "Failed to create workspace"
        })
    }
}

// GET all workspace for the authenticated user
export const getUserWorkspaces = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;

        // WorkspaceMember → includes Workspace → includes Members → includes User
        const allWorkspaces = await prisma.workspaceMember.findMany({
            where: {
                userId: currentUserId
            },
            include: {
                workspace: {
                    include: {
                        members: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: { workspaces: allWorkspaces }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: "Failed to retrieve workspaces"
        })
    }

}

// GET single workspace details (including members)
export const getWorkspaceDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const workspaceId = req.params.workspaceId;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        if (!workspaceId || typeof workspaceId !== "string") {
            return res.status(400).json({
                success: false,
                error: "A Single Workspace ID is required"
            });
        }

        // Check if the user is a member of the workspace
        const userMembership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: currentUserId
                }
            },
            include: {
                workspace: {
                    include: {
                        members: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        if (!userMembership) {
            return res.status(403).json({
                success: false,
                error: "You are not a member of this workspace"
            });
        }

        return res.status(200).json({
            success: true,
            data: { workspace: userMembership.workspace }
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            error: "Failed to retrieve workspace details"
        })
    }
}

// Add member to the workspace
export const addMemberToWorkspace = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const workspaceId = req.params.workspaceId;
        const { participantIds } = req.body;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        if (!workspaceId || typeof workspaceId !== "string") {
            return res.status(400).json({
                success: false,
                error: "A Single Workspace ID is required"
            });
        }

        if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 1) {
            return res.status(400).json({
                success: false,
                error: "At least 1 participantIds are required to add members to workspace"
            });
        }

        // Check if user is member of the workspace
        const UserMembership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: currentUserId
                }
            },
            include: {
                workspace: {
                    include: {
                        members: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        if (!UserMembership) {
            return res.status(403).json({
                success: false,
                error: "You are not a member of this workspace"
            });
        }

        // Check if user is OWNER of the workspace
        if (UserMembership.role !== "OWNER") {
            return res.status(403).json({
                success: false,
                error: "Only workspace owners can add members"
            });
        }

        // check user exists 
        const existingMembers = await prisma.user.findMany({
            where: {
                id: {
                    in: participantIds
                }
            },
            select: {
                id: true
            }
        });

        if (existingMembers.length !== participantIds.length) {
            const existingMemberIds = existingMembers.map(m => m.id);
            const invalidIds = participantIds.filter(id => !existingMemberIds.includes(id));
            return res.status(400).json({
                success: false,
                error: `Some participantIds are invalid: ${invalidIds.join(', ')}`
            });
        }

        // Get already existing workspace members
        const alreadyMembers = await prisma.workspaceMember.findMany({
            where: {
                workspaceId,
                userId: {
                    in: participantIds
                }
            },
            select: {
                userId: true
            }
        });

        const alreadyMemberIds = alreadyMembers.map(m => m.userId);
        const newMemberIds = participantIds.filter(id => !alreadyMemberIds.includes(id));

        if (newMemberIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: "All provided participantIds are already members of the workspace"
            });
        }

        // create workspace members for newMemberIds
        const newMembersData = newMemberIds.map(id => {
            return {
                userId: id,
                workspaceId,
                role: WorkspaceRole.MEMBER
            }
        });

        await prisma.workspaceMember.createMany({
            data: newMembersData
        });

        res.status(200).json({
            success: true,
            data: { message: "Successfully added members to workspace" }
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            error: "Failed to add member to workspace"
        })
    }
}

// remove member from the workspace
export const removeMemberFromWorkspace = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const workspaceId = req.params.workspaceId;
        const { targetUserId } = req.body;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        if (!workspaceId || typeof workspaceId !== "string") {
            return res.status(400).json({
                success: false,
                error: "A Single Workspace ID is required"
            });
        }

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                error: "targetUserId is required to remove member from workspace"
            });
        }

        // Check if user is member of the workspace
        const UserMembership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: currentUserId
                }
            }
        });

        if (!UserMembership) {
            return res.status(403).json({
                success: false,
                error: "You are not a member of this workspace"
            });
        }

        // Check if user is OWNER of the workspace
        if (UserMembership.role !== "OWNER") {
            return res.status(403).json({
                success: false,
                error: "Only workspace owners can remove members"
            });
        }

        // prevent owner from removing themselves
        if (targetUserId === currentUserId) {
            return res.status(400).json({
                success: false,
                error: "Owner cannot remove themselves"
            });
        }

        const targetMembership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: targetUserId
                }
            }
        });

        if (!targetMembership) {
            return res.status(404).json({
                success: false,
                error: "Target user is not a member of this workspace"
            });
        }

        await prisma.workspaceMember.delete({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: targetUserId
                }
            }
        });

        res.status(200).json({
            success: true,
            data: { message: "Successfully removed member from workspace" }
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            error: "Failed to remove member from workspace"
        })
    }
}

// delete workspace
export const deleteWorkspace = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const workspaceId = req.params.workspaceId;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        if (!workspaceId || typeof workspaceId !== "string") {
            return res.status(400).json({
                success: false,
                error: "A Single Workspace ID is required"
            });
        }

        // Check if user is member of the workspace
        const UserMembership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: currentUserId
                }
            }
        });

        if (!UserMembership) {
            return res.status(403).json({
                success: false,
                error: "You are not a member of this workspace"
            });
        }

        // Check if user is OWNER of the workspace
        if (UserMembership.role !== "OWNER") {
            return res.status(403).json({
                success: false,
                error: "Only workspace owners can remove members"
            });
        }
        await prisma.workspace.delete({
            where: {
                id: workspaceId
            }
        });

        res.status(200).json({
            success: true,
            data: { message: "Successfully deleted workspace" }
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            error: "Failed to delete workspace"
        })
    }
}