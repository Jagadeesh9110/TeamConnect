import { useEffect, useState } from "react";
import {
    getWorkspaceDetails,
    getWorkspaceMembers,
    inviteByEmail,
    getPendingInvites,
    revokeInvite,
    removeMemberFromWorkspace,
    deleteWorkspace,
} from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import {
    X,
    Trash2,
    UserPlus,
    UserMinus,
    Shield,
    AlertTriangle,
    Loader2,
    Clock,
    XCircle,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface Member {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface WorkspaceSettingsModalProps {
    workspaceId: string;
    onClose: () => void;
    /** Called after workspace is deleted so parent can refresh */
    onWorkspaceDeleted: () => void;
    /** Called after members change so parent can refresh */
    onMembersChanged?: () => void;
}

/* ─── Tabs ──────────────────────────────────────────────────────────── */

type Tab = "members" | "invite" | "danger";

/* ─── Component ─────────────────────────────────────────────────────── */

export default function WorkspaceSettingsModal({
    workspaceId,
    onClose,
    onWorkspaceDeleted,
    onMembersChanged,
}: WorkspaceSettingsModalProps) {
    const currentUser = useAuthStore((s) => s.user);

    const [tab, setTab] = useState<Tab>("members");
    const [workspaceName, setWorkspaceName] = useState("");
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Is the current user an OWNER?
    const currentMember = members.find((m) => m.id === currentUser?.id);
    const isOwner = currentMember?.role === "OWNER";

    /* ── Load workspace details + members ─────────────────────────────── */

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");

            try {
                const [details, memberList] = await Promise.all([
                    getWorkspaceDetails(workspaceId),
                    getWorkspaceMembers(workspaceId),
                ]);

                setWorkspaceName(details.name);
                setMembers(memberList);
            } catch {
                setError("Failed to load workspace data");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [workspaceId]);

    const refreshMembers = async () => {
        try {
            const memberList = await getWorkspaceMembers(workspaceId);
            setMembers(memberList);
            onMembersChanged?.();
        } catch {
            /* silent */
        }
    };

    /* ── Close on Escape ──────────────────────────────────────────────── */

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    /* ── Render ───────────────────────────────────────────────────────── */

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-[#0e1829] w-[520px] max-h-[80vh] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            Workspace Settings
                        </h2>
                        {workspaceName && (
                            <p className="text-xs text-slate-400 mt-0.5">{workspaceName}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Tab bar ────────────────────────────────────────────────── */}
                <div className="flex border-b border-white/5 px-6 gap-1">
                    {(
                        [
                            { key: "members", label: "Members", icon: Shield },
                            ...(isOwner
                                ? [
                                    { key: "invite", label: "Invite", icon: UserPlus },
                                    { key: "danger", label: "Danger Zone", icon: AlertTriangle },
                                ]
                                : []),
                        ] as { key: Tab; label: string; icon: React.ComponentType<any> }[]
                    ).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => {
                                setTab(key);
                                setError("");
                                setSuccessMsg("");
                            }}
                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 border-b-2 transition-colors ${tab === key
                                ? "border-blue-500 text-blue-400"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Body ───────────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {tab === "members" && (
                                <MembersTab
                                    members={members}
                                    isOwner={isOwner}
                                    currentUserId={currentUser?.id ?? ""}
                                    workspaceId={workspaceId}
                                    onRefresh={refreshMembers}
                                />
                            )}

                            {tab === "invite" && (
                                <InviteTab
                                    workspaceId={workspaceId}
                                    onRefresh={refreshMembers}
                                />
                            )}

                            {tab === "danger" && isOwner && (
                                <DangerTab
                                    workspaceId={workspaceId}
                                    workspaceName={workspaceName}
                                    onDeleted={onWorkspaceDeleted}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* ── Footer messages ────────────────────────────────────────── */}
                {(error || successMsg) && (
                    <div className="px-6 py-3 border-t border-white/5">
                        {error && <p className="text-xs text-red-400">{error}</p>}
                        {successMsg && (
                            <p className="text-xs text-emerald-400">{successMsg}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════════
   ── Members Tab
   ════════════════════════════════════════════════════════════════════════ */

function MembersTab({
    members,
    isOwner,
    currentUserId,
    workspaceId,
    onRefresh,
}: {
    members: Member[];
    isOwner: boolean;
    currentUserId: string;
    workspaceId: string;
    onRefresh: () => Promise<void>;
}) {
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [removeError, setRemoveError] = useState("");

    const handleRemove = async (userId: string) => {
        setRemovingId(userId);
        setRemoveError("");

        try {
            await removeMemberFromWorkspace(workspaceId, userId);
            setConfirmRemoveId(null);
            await onRefresh();
        } catch (err: any) {
            setRemoveError(
                err?.response?.data?.error || "Failed to remove member"
            );
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="space-y-1">
            <p className="text-xs text-slate-400 mb-3">
                {members.length} member{members.length !== 1 && "s"} in this workspace
            </p>

            {removeError && (
                <p className="text-xs text-red-400 mb-2">{removeError}</p>
            )}

            {members.map((member) => {
                const isSelf = member.id === currentUserId;

                return (
                    <div
                        key={member.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                        {/* Avatar + info */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm text-white truncate">
                                    {member.name}
                                    {isSelf && (
                                        <span className="text-xs text-slate-500 ml-1">(you)</span>
                                    )}
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                    {member.email}
                                </p>
                            </div>
                        </div>

                        {/* Role + actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${member.role === "OWNER"
                                    ? "bg-amber-900/40 text-amber-400"
                                    : "bg-slate-700/60 text-slate-300"
                                    }`}
                            >
                                {member.role}
                            </span>

                            {isOwner && !isSelf && (
                                <>
                                    {confirmRemoveId === member.id ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleRemove(member.id)}
                                                disabled={removingId === member.id}
                                                className="text-[10px] px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                                            >
                                                {removingId === member.id ? "…" : "Confirm"}
                                            </button>
                                            <button
                                                onClick={() => setConfirmRemoveId(null)}
                                                className="text-[10px] px-2 py-1 bg-slate-700 rounded text-slate-300 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmRemoveId(member.id)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all p-1 rounded-md hover:bg-white/5"
                                            title="Remove member"
                                        >
                                            <UserMinus className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════════
   ── Invite Tab
   ════════════════════════════════════════════════════════════════════════ */

function InviteTab({
    workspaceId,
    onRefresh,
}: {
    workspaceId: string;
    onRefresh: () => Promise<void>;
}) {
    const [email, setEmail] = useState("");
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Pending invites state
    const [pendingInvites, setPendingInvites] = useState<
        { id: string; email: string; invitedBy: string; createdAt: string; expiresAt: string }[]
    >([]);
    const [loadingInvites, setLoadingInvites] = useState(true);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const fetchPendingInvites = async () => {
        try {
            const result = await getPendingInvites(workspaceId);
            setPendingInvites(result.invites);
        } catch {
            /* silent */
        } finally {
            setLoadingInvites(false);
        }
    };

    useEffect(() => {
        fetchPendingInvites();
    }, [workspaceId]);

    const handleInvite = async () => {
        const trimmed = email.trim().toLowerCase();

        if (!trimmed || !trimmed.includes("@")) {
            setError("Enter a valid email address");
            return;
        }

        setInviting(true);
        setError("");
        setSuccess("");

        try {
            const result = await inviteByEmail(workspaceId, trimmed);

            if (result.type === "added") {
                setSuccess(`✅ ${result.message}`);
                await onRefresh();
            } else {
                setSuccess(`📧 ${result.message}`);
            }
            setEmail("");
            await fetchPendingInvites();
        } catch (err: any) {
            setError(
                err?.response?.data?.error || err.message || "Failed to send invite"
            );
        } finally {
            setInviting(false);
        }
    };

    const handleRevoke = async (inviteId: string) => {
        setRevokingId(inviteId);
        try {
            await revokeInvite(inviteId);
            setPendingInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to cancel invite");
        } finally {
            setRevokingId(null);
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div>
            <p className="text-xs text-slate-400 mb-1">
                Invite by email address
            </p>
            <p className="text-[10px] text-slate-500 mb-4">
                If the user already has an account, they'll be added immediately.
                Otherwise, they'll receive an invite link.
            </p>

            <div className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !inviting && handleInvite()}
                    placeholder="colleague@example.com"
                    className="flex-1 px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                    onClick={handleInvite}
                    disabled={inviting || !email.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors whitespace-nowrap"
                >
                    <UserPlus className="w-4 h-4" />
                    {inviting ? "Sending…" : "Invite"}
                </button>
            </div>

            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            {success && <p className="text-xs text-emerald-400 mt-2">{success}</p>}

            {/* Pending invites list */}
            {loadingInvites ? (
                <div className="flex items-center justify-center py-4 mt-4">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
            ) : pendingInvites.length > 0 ? (
                <div className="mt-5">
                    <p className="text-xs text-slate-400 mb-2">
                        Pending invites ({pendingInvites.length})
                    </p>
                    <div className="space-y-1">
                        {pendingInvites.map((inv) => (
                            <div
                                key={inv.id}
                                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 group"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm text-white truncate">
                                        {inv.email}
                                    </p>
                                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Sent {timeAgo(inv.createdAt)} by {inv.invitedBy}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleRevoke(inv.id)}
                                    disabled={revokingId === inv.id}
                                    title="Cancel invite"
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all p-1 rounded-md hover:bg-white/5 disabled:opacity-50"
                                >
                                    {revokingId === inv.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <XCircle className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════════
   ── Danger Tab (Delete Workspace)
   ════════════════════════════════════════════════════════════════════════ */

function DangerTab({
    workspaceId,
    workspaceName,
    onDeleted,
}: {
    workspaceId: string;
    workspaceName: string;
    onDeleted: () => void;
}) {
    const [confirmName, setConfirmName] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    const canDelete =
        confirmName.trim().toLowerCase() === workspaceName.trim().toLowerCase();

    const handleDelete = async () => {
        if (!canDelete) return;

        setDeleting(true);
        setError("");

        try {
            await deleteWorkspace(workspaceId);
            onDeleted();
        } catch (err: any) {
            setError(
                err?.response?.data?.error || "Failed to delete workspace"
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="border border-red-500/30 rounded-lg p-4 bg-red-950/20">
                <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <h3 className="text-sm font-semibold text-red-400">
                        Delete Workspace
                    </h3>
                </div>

                <p className="text-xs text-slate-300 mb-1">
                    This action <strong>cannot be undone</strong>. This will permanently
                    delete the <strong>{workspaceName}</strong> workspace, all
                    conversations, messages, and member associations.
                </p>

                <p className="text-xs text-slate-400 mt-3 mb-2">
                    Type <strong className="text-white">{workspaceName}</strong> to
                    confirm:
                </p>

                <input
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={workspaceName}
                    className="w-full px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                />

                {error && (
                    <p className="text-xs text-red-400 mt-2">{error}</p>
                )}

                <button
                    onClick={handleDelete}
                    disabled={!canDelete || deleting}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? "Deleting…" : "Delete this workspace"}
                </button>
            </div>
        </div>
    );
}
