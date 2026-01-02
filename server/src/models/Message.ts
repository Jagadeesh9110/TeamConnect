import mongoose, { Document, Schema } from "mongoose";

interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    content: string;
    status: "sent" | "delivered" | "read";
}

const MessageSchema = new Schema<IMessage>({
    conversationId: {
        type: mongoose.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    senderId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent",
        required: true,
    },
}, {
    timestamps: true,
});

const Message = mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
