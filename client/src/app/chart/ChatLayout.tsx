import { useState, useCallback, useEffect, useRef } from "react";
import WorkstreamList from "./WorkstreamList";
import ConversationHeader from "./ConversationHeader";
import MessageTimeline from "./MessageTimeline";
import MessageComposer from "./MessageComposer";
import KnowledgeHub from "./KnowledgeHub";
import { type Conversation, type Message } from "../../types/conversation";
import { getMessagesForConversation } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  joinConversation,
  leaveConversation,
} from "../../lib/socket";

export default function ChatLayout() {
  const currentUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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

  /* ── Typing indicators ───────────────────────────────────────────── */
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const conversationId = activeConversation?.id ?? null;

  /* ── 1. Connect socket on mount ──────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) return;

    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);

  /* ── 2. Join/leave conversation rooms + listen for events ────────── */
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    // Join conversation room
    joinConversation(conversationId);

    // --- Message events ---
    const handleNewMessage = (msg: Message) => {
      // Skip own messages (already added optimistically)
      if (msg.sender?.id === currentUser?.id) return;
      setMessages((prev) => [...prev, msg]);
    };

    const handleEditedMessage = (msg: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? msg : m))
      );
    };

    const handleDeletedMessage = (msg: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? msg : m))
      );
    };

    // --- Typing events ---
    const handleTypingStart = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId !== conversationId) return;
      if (data.userId === currentUser?.id) return;

      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data.userId);
        return next;
      });

      // Auto-clear after 3 seconds
      const existing = typingTimers.current.get(data.userId);
      if (existing) clearTimeout(existing);
      typingTimers.current.set(
        data.userId,
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(data.userId);
            return next;
          });
          typingTimers.current.delete(data.userId);
        }, 3000)
      );
    };

    const handleTypingStop = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId !== conversationId) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
      const timer = typingTimers.current.get(data.userId);
      if (timer) {
        clearTimeout(timer);
        typingTimers.current.delete(data.userId);
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:edited", handleEditedMessage);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      leaveConversation(conversationId);
      socket.off("message:new", handleNewMessage);
      socket.off("message:edited", handleEditedMessage);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);

      // Clear typing state for this conversation
      setTypingUsers(new Map());
      typingTimers.current.forEach((t) => clearTimeout(t));
      typingTimers.current.clear();
    };
  }, [conversationId, currentUser?.id]);

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
            typingUsers={typingUsers}
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

