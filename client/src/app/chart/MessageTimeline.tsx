import { useState, useEffect, useRef } from "react";
import { type Message } from "../../types/conversation";
import { useAuthStore } from "../../store/authStore";
import { editMessage as editMessageApi, deleteMessage as deleteMessageApi } from "../../lib/api";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";

interface MessageTimelineProps {
  conversationId: string | null;
  messages: Message[];
  loading: boolean;
  error: string;
  onMessagesChanged?: (updater: (prev: Message[]) => Message[]) => void;
  typingUsers?: Map<string, string>;
}

export default function MessageTimeline({
  conversationId,
  messages,
  loading,
  error,
  onMessagesChanged,
  typingUsers,
}: MessageTimelineProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        <MessageBubble
          key={msg.id}
          message={msg}
          onMessagesChanged={onMessagesChanged}
        />
      ))}

      {/* Typing indicator */}
      {typingUsers && typingUsers.size > 0 && (
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-slate-400">
            {typingUsers.size === 1
              ? "Someone is typing…"
              : `${typingUsers.size} people are typing…`}
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </main>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ── Single Message Bubble
   ════════════════════════════════════════════════════════════════════════ */

function MessageBubble({
  message,
  onMessagesChanged,
}: {
  message: Message;
  onMessagesChanged?: (updater: (prev: Message[]) => Message[]) => void;
}) {
  const currentUser = useAuthStore((s) => s.user);
  const isSender = currentUser?.id === message.sender.id;

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-focus edit input
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  /* ── Soft-deleted message ─────────────────────────────────────────── */
  if (message.isDeleted) {
    return (
      <div className="flex gap-3 max-w-3xl w-full opacity-60">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0 mt-0.5 bg-slate-700"
        >
          ✕
        </div>
        <div className="flex-1 min-w-0 py-2">
          <p className="text-sm text-slate-500 italic">
            🚫 This message was deleted
          </p>
        </div>
      </div>
    );
  }

  /* ── Edit handlers ────────────────────────────────────────────────── */
  const startEdit = () => {
    setEditValue(message.content);
    setEditing(true);
    setMenuOpen(false);
    setActionError("");
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditValue("");
    setActionError("");
  };

  const saveEdit = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === message.content) {
      cancelEdit();
      return;
    }

    // Optimistic update
    const prevContent = message.content;
    const prevEditedAt = message.editedAt;
    onMessagesChanged?.((prev) =>
      prev.map((m) =>
        m.id === message.id
          ? { ...m, content: trimmed, editedAt: new Date().toISOString() }
          : m
      )
    );
    setEditing(false);
    setSaving(true);
    setActionError("");

    try {
      const { message: updated } = await editMessageApi(message.id, trimmed);
      // Sync with server (replace optimistic with real)
      onMessagesChanged?.((prev) =>
        prev.map((m) => (m.id === message.id ? updated : m))
      );
    } catch (err: any) {
      // Revert
      onMessagesChanged?.((prev) =>
        prev.map((m) =>
          m.id === message.id
            ? { ...m, content: prevContent, editedAt: prevEditedAt }
            : m
        )
      );
      setActionError(err?.response?.data?.error || "Failed to edit");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete handler ───────────────────────────────────────────────── */
  const handleDelete = async () => {
    setMenuOpen(false);
    setActionError("");

    // Confirmation before destructive action
    if (!confirm("Delete this message? This cannot be undone.")) return;

    // Save original for revert
    const prevContent = message.content;

    // Optimistic — clear content for cleaner state
    onMessagesChanged?.((prev) =>
      prev.map((m) =>
        m.id === message.id
          ? { ...m, isDeleted: true, deletedAt: new Date().toISOString(), content: "" }
          : m
      )
    );

    try {
      await deleteMessageApi(message.id);
    } catch (err: any) {
      // Revert
      onMessagesChanged?.((prev) =>
        prev.map((m) =>
          m.id === message.id
            ? { ...m, isDeleted: false, deletedAt: null, content: prevContent }
            : m
        )
      );
      setActionError(err?.response?.data?.error || "Failed to delete");
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  /* ── Normal render ────────────────────────────────────────────────── */
  const initials = message.sender.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hue = hashToHue(message.sender.id);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isEdited = !!message.editedAt;

  return (
    <div className="flex gap-3 max-w-3xl w-full group/msg relative">
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
          {isEdited && (
            <span className="text-[10px] text-slate-500 italic">(edited)</span>
          )}
          {saving && (
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
          )}
        </p>

        {/* Content or edit input */}
        {editing ? (
          <div className="mt-1">
            <textarea
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={2}
              className="w-full text-sm text-white bg-slate-800/80 border border-blue-500/50 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors resize-none"
            />
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={saveEdit}
                className="text-[10px] px-2.5 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="text-[10px] px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <span className="text-[10px] text-slate-500">
                Enter to save · Esc to cancel
              </span>
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-slate-300">
            <RenderContent content={message.content} />
          </div>
        )}

        {/* Error */}
        {actionError && (
          <p className="text-[10px] text-red-400 mt-1">{actionError}</p>
        )}
      </div>

      {/* ⋯ hover menu — sender only */}
      {isSender && !editing && (
        <div className="absolute right-0 top-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="opacity-0 group-hover/msg:opacity-100 text-slate-500 hover:text-slate-300 transition-all p-1 rounded-md hover:bg-white/10"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-[#0e1829] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
              <button
                onClick={startEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Render content with simple ```code``` detection ─────────────────── */
function RenderContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const code = part.slice(3, -3).replace(/^\w*\n/, "");
          return (
            <pre
              key={i}
              className="my-2 p-3 rounded-lg bg-[#0d1117] border border-white/5 text-xs text-slate-300 overflow-x-auto"
            >
              <code>{code}</code>
            </pre>
          );
        }

        // Escape HTML to prevent XSS
        const escaped = part
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        // Parse markdown rules
        const html = escaped
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic text-slate-200">$1</em>')
          .replace(/_(.*?)_/g, '<em class="italic text-slate-200">$1</em>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>')
          .replace(/\n/g, "<br />");

        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
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
