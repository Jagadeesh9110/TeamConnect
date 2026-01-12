export interface Conversation {
    _id: string;
    type: "private" | "group";
    participants: {
        _id: string;
        name: string;
        email: string;
    }[];
    lastMessageAt?: string;
}


/**
 * it is a shared folder 
 * 
 */