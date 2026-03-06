import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const userSelect = {
    id: true,
    fullName: true,
    email: true,
    displayName: true,
};

// ── Create Decision ────────────────────────────────────────────────
export const createDecision = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { conversationId } = req.params;
        const { title, description } = req.body;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        if (!conversationId || typeof conversationId !== "string") {
            return res.status(400).json({ success: false, error: "A single conversationId is required" });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, error: "Title is required" });
        }

        // Verify conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { participants: { select: { userId: true } } },
        });

        if (!conversation) {
            return res.status(404).json({ success: false, error: "Conversation not found" });
        }

        // Verify participant
        const isParticipant = conversation.participants.some(
            (p: { userId: string }) => p.userId === currentUserId
        );
        if (!isParticipant) {
            return res.status(403).json({ success: false, error: "You are not a participant in this conversation" });
        }

        const decision = await prisma.decision.create({
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                conversationId,
                createdById: currentUserId,
            },
            include: {
                createdBy: { select: userSelect },
            },
        });

        // Socket broadcast
        try {
            const { getIO } = await import('../socket/socket.server.js');
            getIO().to(`conversation:${conversationId}`).emit("decision:created", decision);
        } catch { /* socket not ready */ }

        return res.status(201).json({ success: true, data: { decision } });
    } catch (error) {
        console.error("Create Decision Error:", error);
        return res.status(500).json({ success: false, error: "Failed to create decision" });
    }
};

// ── Get Decisions for Conversation ─────────────────────────────────
export const getDecisions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { conversationId } = req.params;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        if (!conversationId || typeof conversationId !== "string") {
            return res.status(400).json({ success: false, error: "A single conversationId is required" });
        }

        // Verify participant
        const participant = await prisma.participant.findFirst({
            where: { conversationId, userId: currentUserId },
        });
        if (!participant) {
            return res.status(403).json({ success: false, error: "You are not a participant in this conversation" });
        }

        const decisions = await prisma.decision.findMany({
            where: { conversationId },
            include: {
                createdBy: { select: userSelect },
            },
            orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json({ success: true, data: { decisions } });
    } catch (error) {
        console.error("Get Decisions Error:", error);
        return res.status(500).json({ success: false, error: "Failed to fetch decisions" });
    }
};

// ── Delete Decision ────────────────────────────────────────────────
export const deleteDecision = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { decisionId } = req.params;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        if (!decisionId || typeof decisionId !== "string") {
            return res.status(400).json({ success: false, error: "A single decisionId is required" });
        }

        const existing = await prisma.decision.findUnique({
            where: { id: decisionId },
            include: {
                conversation: {
                    include: { participants: { select: { userId: true } } },
                },
            },
        });

        if (!existing) {
            return res.status(404).json({ success: false, error: "Decision not found" });
        }

        // Verify participant
        const isParticipant = existing.conversation.participants.some(
            (p: { userId: string }) => p.userId === currentUserId
        );
        if (!isParticipant) {
            return res.status(403).json({ success: false, error: "You are not a participant in this conversation" });
        }

        await prisma.decision.delete({ where: { id: decisionId } });

        // Socket broadcast
        try {
            const { getIO } = await import('../socket/socket.server.js');
            getIO().to(`conversation:${existing.conversationId}`).emit("decision:deleted", { id: decisionId });
        } catch { /* socket not ready */ }

        return res.status(200).json({ success: true, data: { message: "Decision deleted" } });
    } catch (error) {
        console.error("Delete Decision Error:", error);
        return res.status(500).json({ success: false, error: "Failed to delete decision" });
    }
};
