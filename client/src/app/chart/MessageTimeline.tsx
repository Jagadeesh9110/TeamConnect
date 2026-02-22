import { useEffect, useState, useRef } from "react";
import { getMessagesForConversation } from "../../lib/api";
import { type Message } from "../../types/conversation";

interface MessageTimelineProps {
  conversationId: string | null;
}

export default function MessageTimeline({
  conversationId,
}: MessageTimelineProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages
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
        Select a workstream to start collaborating
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar">
      {loading && (
        <p className="text-sm text-slate-400">Loading messages…</p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && messages.length === 0 && (
        <p className="text-sm text-slate-400">
          No messages yet. Start the discussion.
        </p>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      <div ref={bottomRef} />
    </main>
  );
}

/* ── Single message ──────────────────────────────────────────────────── */
function MessageBubble({ message }: { message: Message }) {
  const initials = message.sender.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Stable avatar colour based on sender id
  const hue = hashToHue(message.sender.id);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex gap-3 max-w-3xl w-full">
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0 mt-0.5"
        style={{ backgroundColor: `hsl(${hue}, 55%, 45%)` }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-white">
            {message.sender.fullName}
          </span>
          <span className="text-[11px] text-slate-500">{time}</span>
        </p>

        {/* Content — detect simple code blocks */}
        <div className="text-sm leading-relaxed text-slate-300">
          <RenderContent content={message.content} />
        </div>
      </div>
    </div>
  );
}

/* ── Render content with simple ```code``` detection ─────────────────── */
function RenderContent({ content }: { content: string }) {
  // Split on triple-backtick fencing
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          // Strip the fences
          const code = part.slice(3, -3).replace(/^\w*\n/, ""); // strip optional lang hint on first line
          return (
            <pre
              key={i}
              className="my-2 p-3 rounded-lg bg-[#0d1117] border border-white/5 text-xs text-slate-300 overflow-x-auto"
            >
              <code>{code}</code>
            </pre>
          );
        }
        // Render plain text, preserving bullet points
        return part.split("\n").map((line, j) => (
          <span key={`${i}-${j}`}>
            {line}
            {j < part.split("\n").length - 1 && <br />}
          </span>
        ));
      })}
    </>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────── */
function hashToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
