import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const userPublicSelect = {
    id: true,
    fullName: true,
    email: true,
    displayName: true,
    isOnline: true,
    lastSeenAt: true
};

// Send message in a conversation
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        const { conversationId, content } = req.body;

        if (!conversationId || !content?.trim()) {
            return res.status(400).json({
                success: false,
                error: "conversationId and content are required"
            });
        }

        // Check if conversation exists and user is a participant
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: {
                    where: { userId: currentUserId }
                }
            }
        });

        if (!conversation || conversation.participants.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Conversation not found or access denied"
            });
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                conversationId: conversationId,
                senderId: currentUserId,
                content: content.trim()
            },
            include: {
                sender: {
                    select: userPublicSelect
                }
            }
        });

        // Update conversation's updatedAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        return res.status(201).json({
            success: true,
            data: { message }
        });

    } catch (error) {
        console.error("Send Message Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to send message"
        });
    }
};

// Get all messages for a conversation
export const getConversationMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        const { conversationId } = req.params;  // From URL: /conversations/:conversationId/messages

        if (!conversationId) {
            return res.status(400).json({
                success: false,
                error: "conversationId is required"
            });
        }

        // Verify user is participant
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: {
                    where: { userId: currentUserId }
                }
            }
        });

        if (!conversation || conversation.participants.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Conversation not found or access denied"
            });
        }

        // Fetch all messages
        const messages = await prisma.message.findMany({
            where: { conversationId: conversationId },
            include: {
                sender: {
                    select: userPublicSelect
                }
            },
            orderBy: {
                createdAt: 'asc'  // ✅ Oldest first (chronological chat order)
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                messages,
                count: messages.length
            }
        });

    } catch (error) {
        console.error("Get Conversation Messages Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch messages"
        });
    }
};