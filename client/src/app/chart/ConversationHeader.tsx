import { type Conversation } from "../../types/conversation";

interface ConversationHeaderProps {
  conversation: Conversation | null;
}

export default function ConversationHeader({
    conversation,
}: ConversationHeaderProps) {
    if (!conversation) {
        return (
            <header className="h-16 border-b border-white/5 flex items-center px-6 bg-navy-900/80 backdrop-blur">
                <p className="text-sm text-slate-400">
                    Select a conversation
                </p>
            </header>
        );
    }

 const title =
  conversation.type === "GROUP"
    ? "Group Discussion"
    : conversation.participants
        .map(p => p.user.fullName)
        .join(", ");



    return (
        <header className="h-16 border-b border-white/5 flex items-center px-6 bg-navy-900/80 backdrop-blur">
            <div>
                <h1 className="text-base font-medium text-white">
                    {title}
                </h1>
                <p className="text-xs text-slate-400">
                   {conversation.participants.length} participant
                    {conversation.participants.length > 1 ? "s" : ""}
                </p>
            </div>
        </header>
    );
}