import { useState, useCallback, useEffect } from "react";
import WorkstreamList from "./WorkstreamList";
import ConversationHeader from "./ConversationHeader";
import MessageTimeline from "./MessageTimeline";
import MessageComposer from "./MessageComposer";
import KnowledgeHub from "./KnowledgeHub";
import { type Conversation, type Message } from "../../types/conversation";
import { getMessagesForConversation } from "../../lib/api";

export default function ChatLayout() {
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  // Track whether current user is workspace owner (set by WorkstreamList)
  const [isWorkspaceOwner, setIsWorkspaceOwner] = useState(false);

  // Knowledge Hub: default (35%) or expanded (45%)
  const [hubExpanded, setHubExpanded] = useState(false);

  /* ── Messages state (lifted here so composer can append) ──────────── */
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");

  const conversationId = activeConversation?.id ?? null;

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setMessagesLoading(true);
      setMessagesError("");

      try {
        const data = await getMessagesForConversation(conversationId);
        if (!cancelled) setMessages(data);
      } catch {
        if (!cancelled) setMessagesError("Failed to load messages");
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [conversationId]);

  /** Called by MessageComposer after a successful send */
  const handleMessageSent = useCallback((newMsg: Message) => {
    setMessages((prev) => [...prev, newMsg]);
  }, []);

  /** Called by ConversationHeader after title edit (optimistic or confirmed) */
  const handleConversationUpdated = useCallback((updated: Conversation) => {
    setActiveConversation(updated);
  }, []);

  return (
    <div className="h-screen w-full bg-[#0b1220] text-white flex overflow-hidden">
      {/* ─ Left: Workstream sidebar (fixed 240px) ───────────────── */}
      <WorkstreamList
        activeConversation={activeConversation}
        onSelectConversation={setActiveConversation}
        onOwnershipResolved={setIsWorkspaceOwner}
      />

      {/* ─ Content area ─────────────────────────────────────────── */}
      <div className="flex-1 flex min-w-0">
        {/* ─ Center: Conversation area ──────────────────────────── */}
        <div
          className="flex flex-col min-w-0 transition-all duration-300 ease-in-out"
          style={{ width: hubExpanded ? "55%" : "65%" }}
        >
          <ConversationHeader
            conversation={activeConversation}
            onConversationUpdated={handleConversationUpdated}
            isOwner={isWorkspaceOwner}
          />
          <MessageTimeline
            conversationId={conversationId}
            messages={messages}
            loading={messagesLoading}
            error={messagesError}
            onMessagesChanged={setMessages}
          />
          <MessageComposer
            conversationId={conversationId}
            onMessageSent={handleMessageSent}
          />
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
