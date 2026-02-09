import { useState } from "react";
import Sidebar from "./Sidebar";
import ConversationHeader from "./ConversationHeader";
import MessageTimeline from "./MessageTimeline";
import MessageComposer from "./MessageComposer";
import { type Conversation } from "../../types/conversation";

export default function ChatLayout() {
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  return (
    <div className="h-screen w-full bg-navy-900 text-white flex">
      <Sidebar
        activeConversation={activeConversation}
        onSelectConversation={setActiveConversation}
      />

      <div className="flex-1 flex flex-col">
        <ConversationHeader conversation={activeConversation} />

        <MessageTimeline
          conversationId={activeConversation?.id || null}
        />

        <MessageComposer
          conversationId={activeConversation?.id || null}
        />
      </div>
    </div>
  );
}
