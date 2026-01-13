import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ConversationHeader from "./ConversationHeader";
import MessageTimeline from "./MessageTimeline";
import MessageComposer from "./MessageComposer";
import { type Conversation } from "../../types/conversation";

import { connectSocket, disconnectSocket } from '../../lib/socket';

export default function ChatLayout() {

    const [activeConversation, setActiveConversation] =
        useState<Conversation | null>(null);


    useEffect(() => {
        if (!activeConversation) return;

        const socket = connectSocket();
        socket?.emit("join_conversation", activeConversation._id);

        return () => {
            disconnectSocket();
        };
    }, [activeConversation]);

    return (
        <div className="h-screen w-full bg-navy-900 text-white flex">
            {/* Context Sidebar */}
            <Sidebar
                activeConversation={activeConversation}
                onSelectConversation={setActiveConversation}
            />

            {/* Main Conversation Area */}
            <div className="flex-1 flex flex-col">
                <ConversationHeader conversation={activeConversation} />

                <MessageTimeline
                    conversationId={activeConversation?._id || null}
                />

                <MessageComposer
                    conversationId={activeConversation?._id || null}
                />
            </div>
        </div>
    );
}