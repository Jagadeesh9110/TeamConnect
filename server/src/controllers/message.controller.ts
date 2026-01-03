import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import Message from "../models/Message";
import mongoose from "mongoose";
import Conversation from "../models/Conversation";


// send messages
/**
 * 
 * @param req Client
 → POST /messages
 → MongoDB (Message saved)
 → MongoDB (Conversation updated)
 → Response returned
 * @param res 
 * @returns 
 */
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { conversationId, content } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!conversationId) {
            return res.status(400).json({ error: "Missing conversation ID" });
        }
        if (!content) {
            return res.status(400).json({ error: "Missing message content" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const isParticipant = conversation.participants.some((participant) => participant.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ error: "User is not a participant of this conversation" });
        }

        const message = await Message.create({
            conversationId: new mongoose.Types.ObjectId(conversationId),
            senderId: new mongoose.Types.ObjectId(userId),
            content,
            status: "sent",
        });

        conversation.lastMessageAt = new Date();
        await conversation.save();

        return res.status(201).json(message);



    } catch (error) {
        console.error("Send message error", error);
        res.status(500).json({ error: "Failed to send message" });
    }
}

// fetch messages

export const fetchMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {

        const userId = req.user?.userId;
        const { conversationId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const isParticipant = conversation.participants.some((participant) => participant.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ error: "User is not a participant of this conversation" });
        }

        const messages = await Message.find({ conversationId: new mongoose.Types.ObjectId(conversationId) })
            .sort({ createdAt: 1 });

        return res.status(200).json(messages);

    } catch (err) {
        console.error("Fetch messages error", err)
        res.status(500).json({ error: "Failed to fetch messages" })
    }
}