import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getIO } from '../socket/socket.server.js';

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

    // Broadcast to conversation room
    try {
      getIO().to(`conversation:${conversationId}`).emit("message:new", message);
    } catch { /* socket not ready */ }

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
// Get all messages for a conversation
export const getConversationMessages = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const conversationId = req.params.conversationId;

    // params can be string | string[]
    if (!conversationId || Array.isArray(conversationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversationId",
      });
    }

    // Verify user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: { userId: currentUserId },
        },
      },
    });


    // Check if conversation exists and user is a participant
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found or access denied",
      });
    }

    // Check if user is a participant
    if (conversation.participants.length === 0) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: userPublicSelect,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        messages,
        count: messages.length,
      },
    });
  } catch (error) {
    console.error("Get Conversation Messages Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
    });
  }
};

// Edit a message (sender only)
export const editMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const { messageId } = req.params;
    const { content } = req.body;

    if (!messageId || typeof messageId !== "string") {
      return res.status(400).json({
        success: false,
        error: "messageId is required",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: "content is required",
      });
    }

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: currentUserId },
            },
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found",
      });
    }

    // Must be sender
    if (message.senderId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: "You can only edit your own messages",
      });
    }

    // Must still be a participant
    if (message.conversation.participants.length === 0) {
      return res.status(403).json({
        success: false,
        error: "You are no longer a participant in this conversation",
      });
    }

    // Cannot edit a deleted message
    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        error: "Cannot edit a deleted message",
      });
    }

    // Update message
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        editedAt: new Date(),
      },
      include: {
        sender: {
          select: userPublicSelect,
        },
      },
    });

    // Update conversation.updatedAt
    await prisma.conversation.update({
      where: { id: message.conversationId },
      data: { updatedAt: new Date() },
    });

    // Broadcast to conversation room
    try {
      getIO().to(`conversation:${message.conversationId}`).emit("message:edited", updated);
    } catch { /* socket not ready */ }

    return res.status(200).json({
      success: true,
      data: { message: updated },
    });
  } catch (error) {
    console.error("Edit Message Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to edit message",
    });
  }
};

// Soft-delete a message (sender only)
export const softDeleteMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const { messageId } = req.params;

    if (!messageId || typeof messageId !== "string") {
      return res.status(400).json({
        success: false,
        error: "messageId is required",
      });
    }

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: currentUserId },
            },
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found",
      });
    }

    // Must be sender
    if (message.senderId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own messages",
      });
    }

    // Must still be a participant
    if (message.conversation.participants.length === 0) {
      return res.status(403).json({
        success: false,
        error: "You are no longer a participant in this conversation",
      });
    }

    // Already deleted
    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        error: "Message is already deleted",
      });
    }

    // Soft delete
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
      include: {
        sender: {
          select: userPublicSelect,
        },
      },
    });

    // Update conversation.updatedAt
    await prisma.conversation.update({
      where: { id: message.conversationId },
      data: { updatedAt: new Date() },
    });

    // Broadcast to conversation room
    try {
      getIO().to(`conversation:${message.conversationId}`).emit("message:deleted", updated);
    } catch { /* socket not ready */ }

    return res.status(200).json({
      success: true,
      data: { message: updated },
    });
  } catch (error) {
    console.error("Soft Delete Message Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete message",
    });
  }
};
