import { Request, Response } from "express";
import Conversation from "../models/Conversation";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import mongoose from 'mongoose';

// Create or get a private conversation between two users
export const createPrivateConversation = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { participantId } = req.body;

        if (!userId || !participantId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const participants = [
            new mongoose.Types.ObjectId(userId),
            new mongoose.Types.ObjectId(participantId),
        ];

        // Check if conversation already exists
        const existingConversation = await Conversation.findOne({
            participants: { $all: participants },
        });

        if (existingConversation) {
            return res.status(400).json({ error: "Conversation already exists" });
        }

        const conversation = await Conversation.create({
            participants,
            type: "private",
        });

        return res.status(201).json(conversation);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create private conversation" });
    }
};

// get all conversations of logged in user
export const getAllConversations = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const conversations = await Conversation.find({
            participants: new mongoose.Types.ObjectId(userId)
        }).sort({ updatedAt: -1 }).populate("participants", "name email");

        return res.status(200).json(conversations);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to get conversations" });
    }
}



