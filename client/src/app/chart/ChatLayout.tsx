import { useState } from "react";
import Sidebar from "./Sidebar";
import ConversationHeader from "./ConversationHeader";
import MessageTimeline from "./MessageTimeline";
import MessageComposer from "./MessageComposer";
import { type Conversation } from "../../types/conversation";

export default function ChatLayout() {

    const [activeConversation, setActiveConversation] =
        useState<Conversation | null>(null);


    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

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
                    refreshKey={refreshKey}
                />

                <MessageComposer
                    conversationId={activeConversation?._id || null}
                    onMessageSent={triggerRefresh}
                />
            </div>
        </div>
    );
}