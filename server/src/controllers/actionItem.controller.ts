import { Response } from 'express';
import prisma from '../config/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const userSelect = {
    id: true,
    fullName: true,
    email: true,
    displayName: true,
};

// ── Create Action Item ─────────────────────────────────────────────
export const createActionItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { conversationId } = req.params;
        const { description, assignedToId } = req.body;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        if (!conversationId || typeof conversationId !== "string") {
            return res.status(400).json({ success: false, error: "A single conversationId is required" });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({ success: false, error: "Description is required" });
        }

        // Verify conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { participants: { select: { userId: true } } },
        });

        if (!conversation) {
            return res.status(404).json({ success: false, error: "Conversation not found" });
        }

        // Verify current user is a participant
        const isParticipant = conversation.participants.some(
            (p: { userId: string }) => p.userId === currentUserId
        );
        if (!isParticipant) {
            return res.status(403).json({ success: false, error: "You are not a participant in this conversation" });
        }

        // If assignedToId provided, verify they are a conversation participant
        if (assignedToId) {
            const isAssigneeParticipant = conversation.participants.some(
                (p: { userId: string }) => p.userId === assignedToId
            );
            if (!isAssigneeParticipant) {
                return res.status(400).json({ success: false, error: "Assigned user is not a participant in this conversation" });
            }
        }

        const actionItem = await prisma.actionItem.create({
            data: {
                description: description.trim(),
                conversationId,
                createdById: currentUserId,
                assignedToId: assignedToId || null,
            },
            include: {
                assignedTo: { select: userSelect },
                createdBy: { select: userSelect },
            },
        });

        // Socket broadcast
        try {
            const { getIO } = await import('../socket/socket.server.js');
            getIO().to(`conversation:${conversationId}`).emit("actionItem:created", actionItem);
        } catch { /* socket not ready */ }

        return res.status(201).json({ success: true, data: { actionItem } });
    } catch (error) {
        console.error("Create Action Item Error:", error);
        return res.status(500).json({ success: false, error: "Failed to create action item" });
    }
};

// ── Get Action Items for Conversation ──────────────────────────────
export const getActionItems = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { conversationId } = req.params;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        if (!conversationId || typeof conversationId !== "string") {
            return res.status(400).json({ success: false, error: "A single conversationId is required" });
        }

        // Verify user is participant
        const participant = await prisma.participant.findFirst({
            where: { conversationId, userId: currentUserId },
        });
        if (!participant) {
            return res.status(403).json({ success: false, error: "You are not a participant in this conversation" });
        }

        const actionItems = await prisma.actionItem.findMany({
            where: { conversationId },
            include: {
                assignedTo: { select: userSelect },
                createdBy: { select: userSelect },
            },
            orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json({ success: true, data: { actionItems } });
    } catch (error) {
        console.error("Get Action Items Error:", error);
        return res.status(500).json({ success: false, error: "Failed to fetch action items" });
    }
};

// ── Update Action Item ─────────────────────────────────────────────
export const updateActionItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { actionItemId } = req.params;
        const { description, status, assignedToId } = req.body;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        if (!actionItemId || typeof actionItemId !== "string") {
            return res.status(400).json({ success: false, error: "A single actionItemId is required" });
        }

        const existing = await prisma.actionItem.findUnique({
            where: { id: actionItemId },
            include: {
                conversation: {
                    include: { participants: { select: { userId: true } } },
                },
            },
        });

        if (!existing) {
            return res.status(404).json({ success: false, error: "Action item not found" });
        }

        // Verify participant
        const isParticipant = existing.conversation.participants.some(
            (p: { userId: string }) => p.userId === currentUserId
        );
        if (!isParticipant) {
            return res.status(403).json({ success: false, error: "You are not a participant in this conversation" });
        }

        // Validate status if provided
        const validStatuses = ['OPEN', 'IN_PROGRESS', 'DONE'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: "Invalid status. Must be OPEN, IN_PROGRESS, or DONE" });
        }

        const updateData: Prisma.ActionItemUpdateInput = {};
        if (description !== undefined) updateData.description = description.trim();
        if (status !== undefined) updateData.status = status;
        if (assignedToId !== undefined) updateData.assignedTo = assignedToId ? { connect: { id: assignedToId } } : { disconnect: true };

        const updated = await prisma.actionItem.update({
            where: { id: actionItemId },
            data: updateData,
            include: {
                assignedTo: { select: userSelect },
                createdBy: { select: userSelect },
            },
        });

        // Socket broadcast
        try {
            const { getIO } = await import('../socket/socket.server.js');
            getIO().to(`conversation:${existing.conversationId}`).emit("actionItem:updated", updated);
        } catch { /* socket not ready */ }

        return res.status(200).json({ success: true, data: { actionItem: updated } });
    } catch (error) {
        console.error("Update Action Item Error:", error);
        return res.status(500).json({ success: false, error: "Failed to update action item" });
    }
};

// ── Delete Action Item ─────────────────────────────────────────────
export const deleteActionItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { actionItemId } = req.params;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        if (!actionItemId || typeof actionItemId !== "string") {
            return res.status(400).json({ success: false, error: "A single actionItemId is required" });
        }

        const existing = await prisma.actionItem.findUnique({
            where: { id: actionItemId },
            include: {
                conversation: {
                    include: { participants: { select: { userId: true } } },
                },
            },
        });

        if (!existing) {
            return res.status(404).json({ success: false, error: "Action item not found" });
        }

        // Verify participant
        const isParticipant = existing.conversation.participants.some(
            (p: { userId: string }) => p.userId === currentUserId
        );
        if (!isParticipant) {
            return res.status(403).json({ success: false, error: "You are not a participant in this conversation" });
        }

        await prisma.actionItem.delete({ where: { id: actionItemId } });

        // Socket broadcast
        try {
            const { getIO } = await import('../socket/socket.server.js');
            getIO().to(`conversation:${existing.conversationId}`).emit("actionItem:deleted", { id: actionItemId });
        } catch { /* socket not ready */ }

        return res.status(200).json({ success: true, data: { message: "Action item deleted" } });
    } catch (error) {
        console.error("Delete Action Item Error:", error);
        return res.status(500).json({ success: false, error: "Failed to delete action item" });
    }
};
