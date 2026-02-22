import {
    type Conversation,
    deriveWorkstreamStatus,
} from "../../types/conversation";
import { Users, MoreHorizontal, Hash } from "lucide-react";

const statusDisplay: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    DRAFT: { label: "Draft", bg: "bg-slate-700/60", text: "text-slate-300", dot: "bg-slate-400" },
    ACTIVE: { label: "Active", bg: "bg-emerald-900/40", text: "text-emerald-400", dot: "bg-emerald-400" },
    PENDING: { label: "Decision Pending", bg: "bg-amber-900/40", text: "text-amber-400", dot: "bg-amber-400" },
    RESOLVED: { label: "Resolved", bg: "bg-blue-900/40", text: "text-blue-400", dot: "bg-blue-400" },
};

interface ConversationHeaderProps {
    conversation: Conversation | null;
}

export default function ConversationHeader({
    conversation,
}: ConversationHeaderProps) {
    if (!conversation) {
        return (
            <header className="h-16 border-b border-white/5 flex items-center px-6 bg-[#0e1829]/80 backdrop-blur shrink-0">
                <p className="text-sm text-slate-400">
                    Select a workstream to start
                </p>
            </header>
        );
    }

    const title =
        conversation.type === "GROUP"
            ? "Group Discussion"
            : conversation.participants.map((p) => p.user.fullName).join(", ");

    const status = deriveWorkstreamStatus(conversation);
    const cfg = statusDisplay[status];

    const started = conversation.updatedAt
        ? formatRelative(conversation.updatedAt)
        : "Recently";

    const tag = conversation.type === "GROUP" ? "team" : "private";

    return (
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0e1829]/80 backdrop-blur shrink-0">
            <div className="flex items-center gap-4 min-w-0">
                {/* Title */}
                <h1 className="text-base font-semibold text-white truncate">
                    {title}
                </h1>

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
                <button className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-md hover:bg-white/5">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
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