import { useEffect, useState } from "react";
import { getUserConversations } from "../../lib/api";
import {
    type Conversation,
    type WorkstreamStatus,
    deriveWorkstreamStatus,
} from "../../types/conversation";
import { useAuthStore } from "../../store/authStore";
import TeamConnectLogo from "../components/TeamConnectLogo";
import {
    Plus,
    Filter,
    Server,
    PenTool,
    Layout,
    LogOut,
} from "lucide-react";
import { logoutUser } from "../../lib/api";
import { useNavigate } from "react-router-dom";

/* ── Static workspace stubs ─────────────────────────────────────────── */
const workspaces = [
    { name: "Infrastructure", icon: Server },
    { name: "API Design", icon: PenTool },
    { name: "Frontend Arch", icon: Layout },
];

/* ── Status badge colours ────────────────────────────────────────────── */
const statusConfig: Record<
    WorkstreamStatus,
    { label: string; bg: string; text: string; dot: string }
> = {
    DRAFT: {
        label: "DRAFT",
        bg: "bg-slate-700/60",
        text: "text-slate-300",
        dot: "bg-slate-400",
    },
    ACTIVE: {
        label: "ACTIVE",
        bg: "bg-emerald-900/40",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
    },
    PENDING: {
        label: "PENDING",
        bg: "bg-amber-900/40",
        text: "text-amber-400",
        dot: "bg-amber-400",
    },
    RESOLVED: {
        label: "RESOLVED",
        bg: "bg-blue-900/40",
        text: "text-blue-400",
        dot: "bg-blue-400",
    },
};

/* ── Props ───────────────────────────────────────────────────────────── */
interface WorkstreamListProps {
    activeConversation: Conversation | null;
    onSelectConversation: (conv: Conversation) => void;
}

export default function WorkstreamList({
    activeConversation,
    onSelectConversation,
}: WorkstreamListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const user = useAuthStore((s) => s.user);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getUserConversations();
                setConversations(data);
            } catch {
                setError("Failed to load");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch {
            /* ignore */
        }
        clearAuth();
        navigate("/login");
    };

    return (
        <aside className="w-[240px] shrink-0 flex flex-col border-r border-white/5 bg-[#0c1527]">
            {/* ─ Workspace header ──────────────────────────────────────────── */}
            <div className="px-4 pt-5 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <TeamConnectLogo className="w-7 h-7" />
                    <div className="leading-tight">
                        <p className="text-sm font-semibold text-white">TeamConnect</p>
                        <p className="text-[11px] text-slate-400">Engineering</p>
                    </div>
                </div>
            </div>

            {/* ─ Workspaces (static stubs) ─────────────────────────────────── */}
            <div className="px-3 pt-5">
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Workspaces
                    </span>
                    <button className="text-slate-500 hover:text-slate-300 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="space-y-0.5">
                    {workspaces.map((ws) => (
                        <button
                            key={ws.name}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-slate-300 hover:bg-white/5 transition-colors"
                        >
                            <ws.icon className="w-4 h-4 text-slate-500" />
                            {ws.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─ Workstreams (real conversations) ───────────────────────────── */}
            <div className="px-3 pt-6 flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Workstreams
                    </span>
                    <button className="text-slate-500 hover:text-slate-300 transition-colors">
                        <Filter className="w-3.5 h-3.5" />
                    </button>
                </div>

                {loading && (
                    <p className="text-xs text-slate-500 px-1">Loading…</p>
                )}
                {error && (
                    <p className="text-xs text-red-400 px-1">{error}</p>
                )}

                <div className="space-y-1">
                    {conversations.map((conv) => {
                        const isActive = conv.id === activeConversation?.id;
                        const status = deriveWorkstreamStatus(conv);
                        const cfg = statusConfig[status];

                        // Derive a display name
                        const name =
                            conv.type === "GROUP"
                                ? "Group Discussion"
                                : conv.participants
                                    .map((p) => p.user.fullName)
                                    .join(", ");
                        const tag =
                            conv.type === "GROUP" ? "#team" : "#private";

                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelectConversation(conv)}
                                className={`
                  w-full text-left px-2.5 py-2.5 rounded-lg transition-colors
                  ${isActive
                                        ? "bg-white/[0.08] border border-white/10"
                                        : "hover:bg-white/5 border border-transparent"
                                    }
                `}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-white truncate max-w-[120px]">
                                        {name}
                                    </span>
                                    {isActive && (
                                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-slate-500">{tag}</span>
                                    <span
                                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}
                                    >
                                        {cfg.label}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─ User footer ───────────────────────────────────────────────── */}
            <div className="px-4 py-4 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium text-white shrink-0">
                        {user?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.fullName ?? "User"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                            {user?.email ?? ""}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Log out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
