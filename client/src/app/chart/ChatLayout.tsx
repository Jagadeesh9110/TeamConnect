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

  // Knowledge Hub: collapsed (narrow), default (35%), expanded (45%)
  const [hubMode, setHubMode] = useState<"collapsed" | "default" | "expanded">(
    "default"
  );

  const hubWidth =
    hubMode === "collapsed"
      ? "0%"
      : hubMode === "expanded"
        ? "45%"
        : "35%";

  const centerWidth =
    hubMode === "collapsed"
      ? "100%"
      : hubMode === "expanded"
        ? "55%"
        : "65%";

  const toggleHub = () => {
    setHubMode((prev) =>
      prev === "collapsed"
        ? "default"
        : prev === "default"
          ? "expanded"
          : "collapsed"
    );
  };

  return (
    <div className="h-screen w-full bg-[#0b1220] text-white flex overflow-hidden">
      {/* ─ Left: Workstream sidebar (fixed 240px) ───────────────── */}
      <WorkstreamList
        activeConversation={activeConversation}
        onSelectConversation={setActiveConversation}
      />

      {/* ─ Content area (fills remaining space after sidebar) ──── */}
      <div className="flex-1 flex min-w-0">
        {/* ─ Center: Conversation area ──────────────────────────── */}
        <div
          className="flex flex-col min-w-0 transition-all duration-300 ease-in-out"
          style={{ width: centerWidth }}
        >
          <ConversationHeader conversation={activeConversation} />
          <MessageTimeline conversationId={activeConversation?.id || null} />
          <MessageComposer conversationId={activeConversation?.id || null} />
        </div>

        {/* ─ Right: Knowledge Hub (collapsible) ─────────────────── */}
        <KnowledgeHub
          mode={hubMode}
          width={hubWidth}
          onToggle={toggleHub}
        />
      </div>
    </div>
  );
}
