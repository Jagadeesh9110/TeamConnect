interface ConversationHeaderProps {
    conversation: {
        _id: string;
        participants: {
            _id: string;
            name: string;
            email: string;
        }[];
        type: "private" | "group";
    } | null;
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
        conversation.type === "group"
            ? "Group Discussion"
            : conversation.participants.map(p => p.name).join(", ");

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