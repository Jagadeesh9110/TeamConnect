import { Response } from "express";
import prisma from "../config/prisma.js";
import crypto from "crypto";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { WorkspaceRole } from "../generated/prisma/enums.js";
import { sendEmail } from "../services/email.service.js";


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
        console.error("Create Workspace Error:", err);
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

export const getWorkspaceMembers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currnetUserId = req.user?.userId;
        const workspaceId = req.params.workspaceId;
        if (!currnetUserId) {
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
                    userId: currnetUserId
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

        const members = userMembership.workspace.members.map(m => {
            return {
                id: m.user.id,
                name: m.user.fullName,
                email: m.user.email,
                role: m.role
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                members: members
            }
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            error: "Failed to retrieve workspace members"
        })
    }
}

// Invite member by email (replaces old addMemberToWorkspace)
export const inviteMemberByEmail = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const workspaceId = req.params.workspaceId;
        const { email } = req.body;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        if (!workspaceId || typeof workspaceId !== "string") {
            return res.status(400).json({
                success: false,
                error: "Workspace ID is required"
            });
        }

        if (!email || typeof email !== "string" || !email.includes("@")) {
            return res.status(400).json({
                success: false,
                error: "A valid email address is required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check ownership
        const ownerMembership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: currentUserId
                }
            },
            include: {
                workspace: { select: { name: true } },
                user: { select: { fullName: true, email: true } }
            }
        });

        if (!ownerMembership) {
            return res.status(403).json({
                success: false,
                error: "You are not a member of this workspace"
            });
        }

        if (ownerMembership.role !== "OWNER") {
            return res.status(403).json({
                success: false,
                error: "Only workspace owners can invite members"
            });
        }

        // Self-invite check
        if (ownerMembership.user.email.toLowerCase() === normalizedEmail) {
            return res.status(400).json({
                success: false,
                error: "Cannot invite yourself"
            });
        }

        // Case 1: User already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            // Check if already a member
            const alreadyMember = await prisma.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId,
                        userId: existingUser.id
                    }
                }
            });

            if (alreadyMember) {
                return res.status(400).json({
                    success: false,
                    error: "This user is already a member of the workspace"
                });
            }

            // Add immediately
            await prisma.workspaceMember.create({
                data: {
                    workspaceId,
                    userId: existingUser.id,
                    role: WorkspaceRole.MEMBER
                }
            });

            // Send notification email (fire and forget)
            sendEmail({
                to: normalizedEmail,
                subject: `You've been added to "${ownerMembership.workspace.name}" on TeamConnect`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b1220; color: #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #fff; margin: 0 0 16px;">You've been added!</h2>
                        <p style="line-height: 1.6;">
                            <strong style="color: #60a5fa;">${ownerMembership.user.fullName}</strong> added you to
                            <strong style="color: #fff;">${ownerMembership.workspace.name}</strong> on TeamConnect.
                        </p>
                        <p style="color: #94a3b8; font-size: 14px; margin: 24px 0 0;">Log in to start collaborating.</p>
                    </div>
                `,
                text: `${ownerMembership.user.fullName} added you to "${ownerMembership.workspace.name}" on TeamConnect.`,
            }).catch(() => { }); // non-blocking

            console.info(`[WORKSPACE] Member added: ${existingUser.email} → "${ownerMembership.workspace.name}" (${workspaceId})`);

            return res.status(200).json({
                success: true,
                data: { type: "added", message: `${existingUser.fullName} has been added to the workspace` }
            });
        }

        // Case 2: User does NOT exist — create invite
        // Check for existing pending invite
        const existingInvite = await prisma.workspaceInvite.findFirst({
            where: {
                email: normalizedEmail,
                workspaceId,
                accepted: false,
                expiresAt: { gt: new Date() }
            }
        });

        if (existingInvite) {
            return res.status(400).json({
                success: false,
                error: "An invite has already been sent to this email"
            });
        }

        // Rate limit: max 10 invites per hour per workspace
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentInviteCount = await prisma.workspaceInvite.count({
            where: {
                workspaceId,
                createdAt: { gte: oneHourAgo },
            },
        });

        if (recentInviteCount >= 10) {
            return res.status(429).json({
                success: false,
                error: "Rate limit exceeded. Maximum 10 invites per hour per workspace.",
            });
        }

        // Generate token, hash it, store
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        await prisma.workspaceInvite.create({
            data: {
                email: normalizedEmail,
                workspaceId,
                invitedById: currentUserId,
                tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });

        // Send invite email with raw token
        const inviteUrl = `${process.env.CLIENT_URL}/accept-invite?token=${rawToken}`;

        sendEmail({
            to: normalizedEmail,
            subject: `You're invited to "${ownerMembership.workspace.name}" on TeamConnect`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b1220; color: #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #fff; margin: 0 0 16px;">You're invited!</h2>
                    <p style="line-height: 1.6;">
                        <strong style="color: #60a5fa;">${ownerMembership.user.fullName}</strong> has invited you to join
                        <strong style="color: #fff;">${ownerMembership.workspace.name}</strong> on TeamConnect.
                    </p>
                    <a href="${inviteUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        Accept Invite
                    </a>
                    <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">This link expires in 7 days.</p>
                </div>
            `,
            text: `${ownerMembership.user.fullName} invited you to "${ownerMembership.workspace.name}" on TeamConnect.\n\nAccept: ${inviteUrl}\n\nThis link expires in 7 days.`,
        }).catch(() => { }); // non-blocking

        console.info(`[INVITE] Sent: ${normalizedEmail} → workspace "${ownerMembership.workspace.name}" (${workspaceId}) by user ${currentUserId}`);

        return res.status(200).json({
            success: true,
            data: { type: "invited", message: `Invite email sent to ${normalizedEmail}` }
        });

    } catch (err) {
        console.error("Invite Member Error:", err);
        res.status(500).json({
            success: false,
            error: "Failed to invite member"
        });
    }
}

// remove member from the workspace
export const removeMemberFromWorkspace = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const workspaceId = req.params.workspaceId;
        const targetUserId = req.params.userId;

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

        if (!targetUserId || typeof targetUserId !== "string") {
            return res.status(400).json({
                success: false,
                error: "Target User ID is required to remove member from workspace"
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