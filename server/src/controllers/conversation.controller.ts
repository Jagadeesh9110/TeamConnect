import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';


// Reusable user select object (DRY principle)
export const userPublicSelect = {
    id: true,
    fullName: true,
    email: true,
    displayName: true,
    isOnline: true,
    lastSeenAt: true
};

// Create a PRIVATE conversation between two users (current user + another user)
export const createPrivateConversation = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { participantId } = req.body;

        // Check if user is authenticated
        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        // Check if participantId is provided
        if (!participantId) {
            return res.status(400).json({
                success: false,
                error: "participantId is required"
            });
        }

        // Check if user is trying to create conversation with themselves
        if (currentUserId === participantId) {
            return res.status(400).json({
                success: false,
                error: "Cannot create conversation with yourself"
            });
        }

        // Check if the other user exists
        const otherUser = await prisma.user.findUnique({
            where: { id: participantId }
        });

        if (!otherUser) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        // Check if a PRIVATE conversation already exists between these two users
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                type: "PRIVATE",
                AND: [
                    {
                        participants: {
                            some: {
                                userId: currentUserId
                            }
                        }
                    },
                    {
                        participants: {
                            some: {
                                userId: participantId
                            }
                        }
                    }
                ]
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: userPublicSelect
                        }
                    }
                }
            }
        });

        // If conversation exists, return it
        if (existingConversation) {
            return res.status(200).json({
                success: true,
                data: {
                    conversation: existingConversation,
                    isNew: false,
                    message: "Conversation retrieved successfully"
                }
            });
        }

        // Create new PRIVATE conversation with nested participant creation
        const newConversation = await prisma.conversation.create({
            data: {
                type: "PRIVATE",
                createdById: currentUserId,
                participants: {
                    create: [
                        {
                            userId: currentUserId
                        },
                        {
                            userId: participantId
                        }
                    ]
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: userPublicSelect
                        }
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            data: {
                conversation: newConversation,
                isNew: true,
                message: "Conversation created successfully"
            }
        });

    } catch (error) {
        console.error("Create Private Conversation Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to create private conversation"
        });
    }
};

// Fetch all conversations for the authenticated user
export async function getUserConversations(req:AuthenticatedRequest,res:Response){
    try{
        const CurrUserId = req.user?.userId;
        if(!CurrUserId){
           return res.status(401).json({
            success:false,
            error:"Unauthorized"
        });
        }
        const conversations = await prisma.conversation.findMany({
            where:{
                participants:{
                    some:{
                        userId:CurrUserId
                    }
                }
            },
            include:{
                participants:{
                    include:{
                        user: {
                            select: userPublicSelect
                        }
                    }
                },
                messages:{
                     take: 1,  // Get last message
                    orderBy: {
                        createdAt: 'desc'
                    },
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        status: true,
                        senderId: true
                    }
                },
                _count:{
                    select:{
                        messages:true
                    }
                }
            },
             orderBy:{
                updatedAt:'desc'
            }

        });
                
        return res.status(200).json({
            success:true,
            data:{ 
                conversations, // Could be []
                count: conversations.length
            },
            message:"Conversations fetched successfully"
        });
       
    }
    catch(error){
        console.error("Get User Conversations Error:",error);
        return res.status(500).json({
            success:false,
            error:"Failed to fetch conversations"
        });
        
    }

}