import mongoose, { Document, Schema } from "mongoose";

interface IConversation extends Document {
    participants: string[];
    type: "private" | "group";
    lastMessageAt?: Date;
}

const ConversationSchema = new Schema<IConversation>({
    participants: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    ],
    type: {
        type: String,
        enum: ["private", "group"],
        default: "private",
        required: true,
    },
    lastMessageAt: {
        type: Date,
        required: false,
    },
},
    {
        timestamps: true,
    });

const Conversation = mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;