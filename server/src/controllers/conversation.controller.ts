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
        const { workspaceId, participantId } = req.body;

        // Check if user is authenticated
        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        // Check if workspaceId is provided
        if (!workspaceId) {
            return res.status(400).json({
                success: false,
                error: "workspaceId is required"
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

        // Check workspace exists 
        const workspace = await prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        })

        if (!workspace) {
            return res.status(404).json({
                success: false,
                error: "Workspace not found"
            });
        }

        // Check if current user is a member of the workspace
        const currnetUserMembership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: currentUserId

                }
            }
        });

        if (!currnetUserMembership) {
            return res.status(403).json({
                success: false,
                error: "You are not a member of this workspace"
            });
        }

        // Check if the other user is a member of the workspace
        const currnetParticipantMembership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: participantId

                }
            }
        });

        if (!currnetParticipantMembership) {
            return res.status(403).json({
                success: false,
                error: "The participant is not a member of this workspace"
            });
        }

        // Check if a PRIVATE conversation already exists between these two users
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                workspaceId,
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
                workspaceId: workspaceId,
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

// create a group conversation for the authenticated user
export const createGroupConversation = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { workspaceId, participantIds, title } = req.body;

        // Check if user is authenticated
        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        // chceck if workspaceId is provided
        if (!workspaceId) {
            return res.status(400).json({
                success: false,
                error: "workspaceId is required"
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                error: "Title is required for group conversations"
            })
        }

        if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 1) {
            return res.status(400).json({
                success: false,
                error: "At least 1 participantIds are required to create a group conversation"
            });
        }

        const filterParticipantUsers = participantIds.filter(id => id !== currentUserId);
        if (filterParticipantUsers.length < 1) {
            return res.status(400).json({
                success: false,
                error: "At least 1 other participant is required to create a group conversation"
            });
        }

        const uniqueParticipantIds = [...new Set(filterParticipantUsers)];
        if (uniqueParticipantIds.length !== filterParticipantUsers.length) {
            return res.status(400).json({
                success: false,
                error: "Duplicate participant IDs are not allowed"
            });
        }

        // Check workspace exists 
        const workspace = await prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        })

        if (!workspace) {
            return res.status(404).json({
                success: false,
                error: "Workspace not found"
            });
        }

        // Check if current user is a member of the workspace
        const currnetUserMembership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: currentUserId
                }
            }
        });

        if (!currnetUserMembership) {
            return res.status(403).json({
                success: false,
                error: "You are not a member of this workspace"
            });
        }

        // Check if all other users are members of the workspace
        const participantMemberships = await prisma.workspaceMember.findMany({
            where: {
                workspaceId,
                userId: {
                    in: uniqueParticipantIds
                }
            }
        });

        // If any participant is not a member of the workspace, return an error
        if (participantMemberships.length !== uniqueParticipantIds.length) {
            const missingParticipants = uniqueParticipantIds.filter(id => {
                return !participantMemberships.some(m => m.userId === id);
            });

            return res.status(400).json({
                success: false,
                error: `The following participants are not members of the workspace: ${missingParticipants.join(', ')}`
            });
        }

        // Create new GROUP conversation with nested participant creation
        const newConversation = await prisma.conversation.create({
            data: {
                workspaceId,
                type: "GROUP",
                title,
                createdById: currentUserId,
                participants: {
                    create: [
                        {
                            userId: currentUserId
                        },
                        ...uniqueParticipantIds.map(id => {
                            return ({ userId: id });
                        })
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
        })

        return res.status(201).json({
            success: true,
            data: {
                conversation: newConversation,
                isNew: true,
                message: "Group conversation created successfully"
            }
        });
    } catch (error) {
        console.error("Create Group Conversation Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to create group conversation"
        });
    }

}

// Fetch all conversations for the authenticated user
export async function getUserConversations(req: AuthenticatedRequest, res: Response) {
    try {
        const CurrUserId = req.user?.userId;
        const { workspaceId } = req.query;


        // Check if user is authenticated
        if (!CurrUserId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        //check if workspaceId is provided
        if (!workspaceId || typeof workspaceId !== 'string') {
            return res.status(400).json({
                success: false,
                error: "A single valid workspaceId is required"
            });
        }

        // Check if user is a member of the workspace
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: CurrUserId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                error: "You are not a member of this workspace"
            });
        }



        const conversations = await prisma.conversation.findMany({
            where: {
                workspaceId,
                participants: {
                    some: {
                        userId: CurrUserId
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: userPublicSelect
                        }
                    }
                },
                messages: {
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
                _count: {
                    select: {
                        messages: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }

        });

        return res.status(200).json({
            success: true,
            data: {
                conversations, // Could be []
                count: conversations.length
            }
        });

    }
    catch (error) {
        console.error("Get User Conversations Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch conversations"
        });

    }

}