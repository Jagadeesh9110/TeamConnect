import Sidebar from "./Sidebar";
import ConversationHeader from "./ConversationHeader";
import MessageTimeline from "./MessageTimeline";
import MessageComposer from "./MessageComposer";

export default function ChatLayout() {
    return (
        <div className="h-screen w-full bg-navy-900 text-white flex">
            {/* Context Sidebar */}
            <Sidebar />

            {/* Main Conversation Area */}
            <div className="flex-1 flex flex-col">
                <ConversationHeader />
                <MessageTimeline />
                <MessageComposer />
            </div>
        </div>
    );
}