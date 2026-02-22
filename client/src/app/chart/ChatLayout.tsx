import { useState } from "react";
import WorkstreamList from "./WorkstreamList";
import ConversationHeader from "./ConversationHeader";
import MessageTimeline from "./MessageTimeline";
import MessageComposer from "./MessageComposer";
import KnowledgeHub from "./KnowledgeHub";
import { type Conversation } from "../../types/conversation";

export default function ChatLayout() {
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  // Knowledge Hub: default (35%) or expanded (45%)
  const [hubExpanded, setHubExpanded] = useState(false);

  return (
    <div className="h-screen w-full bg-[#0b1220] text-white flex overflow-hidden">
      {/* ─ Left: Workstream sidebar (fixed 240px) ───────────────── */}
      <WorkstreamList
        activeConversation={activeConversation}
        onSelectConversation={setActiveConversation}
      />

      {/* ─ Content area ─────────────────────────────────────────── */}
      <div className="flex-1 flex min-w-0">
        {/* ─ Center: Conversation area ──────────────────────────── */}
        <div
          className="flex flex-col min-w-0 transition-all duration-300 ease-in-out"
          style={{ width: hubExpanded ? "55%" : "65%" }}
        >
          <ConversationHeader conversation={activeConversation} />
          <MessageTimeline conversationId={activeConversation?.id || null} />
          <MessageComposer conversationId={activeConversation?.id || null} />
        </div>

        {/* ─ Right: Knowledge Hub ───────────────────────────────── */}
        <KnowledgeHub
          expanded={hubExpanded}
          onToggle={() => setHubExpanded((prev) => !prev)}
        />
      </div>
    </div>
  );
}
