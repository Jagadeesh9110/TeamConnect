import { useState, useRef, useEffect } from "react";
import {
    type Conversation,
    deriveWorkstreamStatus,
} from "../../types/conversation";
import { updateConversationTitle } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { Users, MoreHorizontal, Hash, Pencil, Loader2 } from "lucide-react";

const statusDisplay: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    DRAFT: { label: "Draft", bg: "bg-slate-700/60", text: "text-slate-300", dot: "bg-slate-400" },
    ACTIVE: { label: "Active", bg: "bg-emerald-900/40", text: "text-emerald-400", dot: "bg-emerald-400" },
    PENDING: { label: "Decision Pending", bg: "bg-amber-900/40", text: "text-amber-400", dot: "bg-amber-400" },
    RESOLVED: { label: "Resolved", bg: "bg-blue-900/40", text: "text-blue-400", dot: "bg-blue-400" },
};

interface ConversationHeaderProps {
    conversation: Conversation | null;
    /** Called after title is updated so parent can sync state */
    onConversationUpdated?: (updated: Conversation) => void;
    /** Whether current user is workspace owner */
    isOwner?: boolean;
}

/**
 * Derive a display title from conversation data.
 * PRIVATE → show only the OTHER participant's name (never yourself).
 * GROUP   → prefer saved title, fallback to "Group Discussion".
 */
function getDisplayTitle(conv: Conversation, currentUserId: string): string {
    if (conv.title) return conv.title;

    if (conv.type === "PRIVATE") {
        const other = conv.participants.find((p) => p.user.id !== currentUserId);
        return other?.user.fullName ?? "Unknown User";
    }

    // GROUP without a title
    return "Group Discussion";
}

export default function ConversationHeader({
    conversation,
    onConversationUpdated,
    isOwner = false,
}: ConversationHeaderProps) {
    const currentUser = useAuthStore((s) => s.user);

    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Reset edit/menu state when conversation changes
    useEffect(() => {
        setEditing(false);
        setMenuOpen(false);
        setError("");
    }, [conversation?.id]);

    // Auto-focus input when entering edit mode
    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

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

    if (!conversation) {
        return (
            <header className="h-16 border-b border-white/5 flex items-center px-6 bg-[#0e1829]/80 backdrop-blur shrink-0">
                <p className="text-sm text-slate-400">
                    Select a workstream to start
                </p>
            </header>
        );
    }

    const displayTitle = getDisplayTitle(conversation, currentUser?.id ?? "");
    const status = deriveWorkstreamStatus(conversation);
    const cfg = statusDisplay[status];

    const started = conversation.updatedAt
        ? formatRelative(conversation.updatedAt)
        : "Recently";

    const tag = conversation.type === "GROUP" ? "team" : "private";

    /* ── Rename logic ──────────────────────────────────────────────────── */

    const startEditing = () => {
        setMenuOpen(false);
        setEditValue(displayTitle);
        setEditing(true);
        setError("");
    };

    const cancelEditing = () => {
        setEditing(false);
        setEditValue("");
        setError("");
    };

    const saveTitle = async () => {
        const trimmed = editValue.trim();

        // No change — just close
        if (!trimmed || trimmed === displayTitle) {
            cancelEditing();
            return;
        }

        // Optimistic update
        const previousTitle = conversation.title;
        const optimisticConv: Conversation = { ...conversation, title: trimmed };
        onConversationUpdated?.(optimisticConv);

        setSaving(true);
        setError("");

        try {
            const { conversation: updated } = await updateConversationTitle(
                conversation.id,
                trimmed
            );
            onConversationUpdated?.(updated);
            setEditing(false);
        } catch (err: any) {
            // Revert optimistic update
            const revertedConv: Conversation = { ...conversation, title: previousTitle };
            onConversationUpdated?.(revertedConv);
            setError(err?.response?.data?.error || "Failed to update title");
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            saveTitle();
        } else if (e.key === "Escape") {
            cancelEditing();
        }
    };

    /* ── Render ─────────────────────────────────────────────────────────── */

    return (
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0e1829]/80 backdrop-blur shrink-0">
            <div className="flex items-center gap-4 min-w-0">
                {/* Title — inline editable when "Rename" is clicked from menu */}
                {editing ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                        <input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={saveTitle}
                            disabled={saving}
                            className="text-base font-semibold text-white bg-slate-800/80 border border-blue-500/50 rounded-md px-2 py-0.5 outline-none focus:border-blue-500 transition-colors min-w-[120px] max-w-[300px]"
                        />
                        {saving && (
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                        )}
                    </div>
                ) : (
                    <h1 className="text-base font-semibold text-white truncate">
                        {displayTitle}
                    </h1>
                )}

                {/* Error toast */}
                {error && (
                    <span className="text-[10px] text-red-400 shrink-0">{error}</span>
                )}

                {/* Status badge */}
                <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md shrink-0 ${cfg.bg} ${cfg.text}`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                </span>

                {/* Meta */}
                <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 shrink-0">
                    <span>📅 {started}</span>
                    <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {tag}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
                <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2.5 py-1.5 rounded-md hover:bg-white/5">
                    <Users className="w-3.5 h-3.5" />
                    Invite
                </button>

                {/* ⋯ menu with dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-md hover:bg-white/5"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-[#0e1829] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                            {isOwner && (
                                <button
                                    onClick={startEditing}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Rename
                                </button>
                            )}
                            {/* Add more menu items here as needed */}
                            {!isOwner && (
                                <p className="px-4 py-2.5 text-xs text-slate-500">
                                    No actions available
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

/* ── Helpers ──────────────────────────────────────────────────────────── */
function formatRelative(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}