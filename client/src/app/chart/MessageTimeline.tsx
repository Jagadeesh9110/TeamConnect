import { useEffect, useState, useRef } from "react";
import { getMessagesForConversation } from "../../lib/api";
import { type Message } from "../../types/conversation";

interface MessageTimelineProps {
  conversationId: string | null;
}

export default function MessageTimeline({ conversationId }: MessageTimelineProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages via REST
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMessagesForConversation(conversationId);
        setMessages(data);
      } catch {
        setError("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  if (!conversationId) {
    return (
      <main className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Select a conversation to start working
      </main>
    );
  }

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      {loading && <p className="text-sm text-slate-400">Loading messages…</p>}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && messages.length === 0 && (
        <p className="text-sm text-slate-400">
          No messages yet. Start the discussion.
        </p>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className="max-w-3xl w-full">
          <p className="text-sm text-slate-400 mb-1">
            {msg.sender.fullName} · {formatTime(msg.createdAt)}
          </p>
          <div className="rounded-xl bg-white/5 px-4 py-3 text-sm leading-relaxed text-slate-300">
            {msg.content}
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </main>
  );
}
