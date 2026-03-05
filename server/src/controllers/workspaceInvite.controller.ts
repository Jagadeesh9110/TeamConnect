import { Request, Response } from "express";
import prisma from "../config/prisma.js";
import crypto from "crypto";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { WorkspaceRole } from "../generated/prisma/enums.js";

// hash raw token for lookup
const hashToken = (token: string) =>
    crypto.createHash("sha256").update(token).digest("hex");

// Validate invite — PUBLIC endpoint (user may not be logged in)
export const validateInvite = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        if (!token || typeof token !== "string") {
            return res.status(400).json({
                success: false,
                error: "Invite token is required",
            });
        }

        const tokenHash = hashToken(token);

        const invite = await prisma.workspaceInvite.findUnique({
            where: { tokenHash },
            include: {
                workspace: { select: { name: true } },
            },
        });

        if (!invite) {
            return res.status(404).json({
                success: false,
                error: "Invalid invite link",
            });
        }

        // Don't expose invite.email publicly — security
        return res.status(200).json({
            success: true,
            data: {
                valid: !invite.accepted && invite.expiresAt > new Date(),
                workspaceName: invite.workspace.name,
                expiresAt: invite.expiresAt,
                accepted: invite.accepted,
                expired: invite.expiresAt <= new Date(),
            },
        });
    } catch (error) {
        console.error("Validate Invite Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to validate invite",
        });
    }
};

// Accept invite — AUTHENTICATED endpoint
export const acceptInvite = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
            });
        }

        const { token } = req.body;

        if (!token || typeof token !== "string") {
            return res.status(400).json({
                success: false,
                error: "Invite token is required",
            });
        }

        const tokenHash = hashToken(token);

        const invite = await prisma.workspaceInvite.findUnique({
            where: { tokenHash },
            include: {
                workspace: { select: { id: true, name: true } },
            },
        });

        if (!invite) {
            return res.status(404).json({
                success: false,
                error: "Invalid invite link",
            });
        }

        // Re-check expiry (never trust validate result)
        if (invite.expiresAt <= new Date()) {
            return res.status(400).json({
                success: false,
                error: "This invite link has expired",
            });
        }

        if (invite.accepted) {
            return res.status(400).json({
                success: false,
                error: "This invite has already been used",
            });
        }

        // Critical security check: invite.email === logged-in user's email
        const currentUser = await prisma.user.findUnique({
            where: { id: currentUserId },
            select: { email: true },
        });

        if (!currentUser) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
            });
        }

        if (currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
            return res.status(403).json({
                success: false,
                error: `This invite was sent to a different email address. You're logged in as ${currentUser.email}.`,
            });
        }

        // Check if already a member (race condition guard)
        const alreadyMember = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: invite.workspaceId,
                    userId: currentUserId,
                },
            },
        });

        if (alreadyMember) {
            // Mark invite as accepted anyway
            await prisma.workspaceInvite.update({
                where: { id: invite.id },
                data: { accepted: true, acceptedAt: new Date() },
            });

            return res.status(200).json({
                success: true,
                data: {
                    workspaceId: invite.workspaceId,
                    workspaceName: invite.workspace.name,
                    message: "You are already a member of this workspace",
                },
            });
        }

        // Atomic: add member + mark accepted (transaction)
        await prisma.$transaction([
            prisma.workspaceMember.create({
                data: {
                    workspaceId: invite.workspaceId,
                    userId: currentUserId,
                    role: WorkspaceRole.MEMBER,
                },
            }),
            prisma.workspaceInvite.update({
                where: { id: invite.id },
                data: { accepted: true, acceptedAt: new Date() },
            }),
        ]);

        console.info(`[INVITE] Accepted: ${currentUser.email} joined workspace "${invite.workspace.name}" (${invite.workspaceId})`);

        return res.status(200).json({
            success: true,
            data: {
                workspaceId: invite.workspaceId,
                workspaceName: invite.workspace.name,
                message: `You've joined ${invite.workspace.name}!`,
            },
        });
    } catch (error) {
        console.error("Accept Invite Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to accept invite",
        });
    }
};

// Get pending invites for a workspace — OWNER only
export const getPendingInvites = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const workspaceId = req.params.workspaceId;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        if (!workspaceId || typeof workspaceId !== "string") {
            return res.status(400).json({ success: false, error: "Workspace ID is required" });
        }

        // Owner check
        const membership = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: currentUserId } },
        });

        if (!membership || membership.role !== "OWNER") {
            return res.status(403).json({
                success: false,
                error: "Only workspace owners can view pending invites",
            });
        }

        const invites = await prisma.workspaceInvite.findMany({
            where: {
                workspaceId,
                accepted: false,
                expiresAt: { gt: new Date() },
            },
            include: {
                invitedBy: { select: { fullName: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({
            success: true,
            data: {
                invites: invites.map((inv) => ({
                    id: inv.id,
                    email: inv.email,
                    invitedBy: inv.invitedBy.fullName,
                    createdAt: inv.createdAt,
                    expiresAt: inv.expiresAt,
                })),
            },
        });
    } catch (error) {
        console.error("Get Pending Invites Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch pending invites",
        });
    }
};

// Revoke (cancel) a pending invite — OWNER only
export const revokeInvite = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const inviteId = req.params.inviteId;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        if (!inviteId || typeof inviteId !== "string") {
            return res.status(400).json({ success: false, error: "Invite ID is required" });
        }

        const invite = await prisma.workspaceInvite.findUnique({
            where: { id: inviteId },
            include: {
                workspace: { select: { name: true } },
            },
        });

        if (!invite) {
            return res.status(404).json({ success: false, error: "Invite not found" });
        }

        if (invite.accepted) {
            return res.status(400).json({ success: false, error: "Cannot revoke an already accepted invite" });
        }

        // Owner check on the invite's workspace
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: invite.workspaceId,
                    userId: currentUserId,
                },
            },
        });

        if (!membership || membership.role !== "OWNER") {
            return res.status(403).json({
                success: false,
                error: "Only workspace owners can revoke invites",
            });
        }

        await prisma.workspaceInvite.delete({ where: { id: inviteId } });

        console.info(`[INVITE] Revoked: invite to ${invite.email} for workspace "${invite.workspace.name}" cancelled by user ${currentUserId}`);

        return res.status(200).json({
            success: true,
            data: { message: `Invite to ${invite.email} has been revoked` },
        });
    } catch (error) {
        console.error("Revoke Invite Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to revoke invite",
        });
    }
};
