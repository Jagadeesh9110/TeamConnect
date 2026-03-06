import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { generateConversationSummary } from '../services/gemini.service.js';

// ── Generate Summary ───────────────────────────────────────────────
export const summarizeConversation = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { conversationId } = req.params;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        if (!conversationId || typeof conversationId !== "string") {
            return res.status(400).json({ success: false, error: "A single conversationId is required" });
        }

        // Verify conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });
        if (!conversation) {
            return res.status(404).json({ success: false, error: "Conversation not found" });
        }

        // Verify participant
        const participant = await prisma.participant.findFirst({
            where: { conversationId, userId: currentUserId },
        });
        if (!participant) {
            return res.status(403).json({ success: false, error: "You are not a participant in this conversation" });
        }

        // Rate limit: if summary exists within last 5 minutes, return it
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentSummary = await prisma.conversationSummary.findFirst({
            where: { conversationId, createdAt: { gte: fiveMinutesAgo } },
            orderBy: { createdAt: 'desc' },
        });
        if (recentSummary) {
            return res.status(200).json({ success: true, data: { summary: recentSummary } });
        }

        // Fetch last 50 messages
        const messages = await prisma.message.findMany({
            where: { conversationId, isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        if (messages.length === 0) {
            return res.status(400).json({ success: false, error: "No messages to summarize" });
        }

        // Reverse to chronological order and extract content
        const textMessages = messages.reverse().map((m) => m.content);

        // Generate summary via Gemini
        const summaryText = await generateConversationSummary(textMessages);

        // Store summary with message count
        const summary = await prisma.conversationSummary.create({
            data: {
                summary: summaryText,
                messageCount: messages.length,
                conversationId,
            },
        });

        // Socket broadcast
        try {
            const { getIO } = await import('../socket/socket.server.js');
            getIO().to(`conversation:${conversationId}`).emit("summary:generated", summary);
        } catch { /* socket not ready */ }

        console.info(`[SUMMARY] Generated for conversationId=${conversationId} by userId=${currentUserId}`);

        return res.status(201).json({ success: true, data: { summary } });
    } catch (error: any) {
        console.error("Summarize Conversation Error:", error);

        if (error.message?.includes("GEMINI_API_KEY")) {
            return res.status(503).json({ success: false, error: "AI service is not configured" });
        }

        return res.status(500).json({ success: false, error: "Failed to generate summary" });
    }
};

// ── Get Latest Summary ─────────────────────────────────────────────
export const getConversationSummary = async (req: AuthenticatedRequest, res: Response) => {
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

        // Get latest summary
        const summary = await prisma.conversationSummary.findFirst({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json({
            success: true,
            data: { summary: summary || null },
        });
    } catch (error) {
        console.error("Get Summary Error:", error);
        return res.status(500).json({ success: false, error: "Failed to fetch summary" });
    }
};
