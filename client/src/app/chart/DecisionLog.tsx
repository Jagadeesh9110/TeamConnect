import { useEffect, useState } from "react";
import {
    getDecisions,
    createDecision,
    deleteDecision,
} from "../../lib/api";
import { type Decision } from "../../types/conversation";
import { getSocket } from "../../lib/socket";
import { Loader2, Plus, Trash2, FileText, X } from "lucide-react";

interface DecisionLogProps {
    conversationId: string | null;
}

export default function DecisionLog({ conversationId }: DecisionLogProps) {
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [adding, setAdding] = useState(false);

    // Fetch decisions when conversation changes
    useEffect(() => {
        if (!conversationId) {
            setDecisions([]);
            return;
        }

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const data = await getDecisions(conversationId);
                if (!cancelled) setDecisions(data.decisions);
            } catch {
                // Silently fail
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [conversationId]);

    // Real-time socket listeners
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !conversationId) return;

        const onCreated = (decision: Decision) => {
            setDecisions((prev) => [decision, ...prev]);
        };

        const onDeleted = ({ id }: { id: string }) => {
            setDecisions((prev) => prev.filter((d) => d.id !== id));
        };

        socket.on("decision:created", onCreated);
        socket.on("decision:deleted", onDeleted);

        return () => {
            socket.off("decision:created", onCreated);
            socket.off("decision:deleted", onDeleted);
        };
    }, [conversationId]);

    const handleCreate = async () => {
        if (!conversationId || !newTitle.trim()) return;
        setAdding(true);
        try {
            const data = await createDecision(
                conversationId,
                newTitle.trim(),
                newDesc.trim() || undefined
            );
            setDecisions((prev) => [data.decision, ...prev]);
            setNewTitle("");
            setNewDesc("");
            setShowAdd(false);
        } catch (err) {
            console.error("Failed to create decision:", err);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (decisionId: string) => {
        setDecisions((prev) => prev.filter((d) => d.id !== decisionId));
        try {
            await deleteDecision(decisionId);
        } catch {
            // Could revert
        }
    };

    if (!conversationId) {
        return (
            <div>
                <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <span className="text-base leading-none">✧</span> Decision Log
                </h3>
                <p className="text-xs text-slate-500">Select a conversation to view decisions.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-base leading-none">✧</span> Decision Log
                    {decisions.length > 0 && (
                        <span className="text-[10px] font-normal text-slate-500 ml-1">
                            ({decisions.length})
                        </span>
                    )}
                </h3>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                    {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
            </div>

            {/* Add form */}
            {showAdd && (
                <div className="mb-3 space-y-2">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Decision title..."
                        className="w-full text-xs bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        autoFocus
                    />
                    <textarea
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Rationale / description (optional)..."
                        rows={2}
                        className="w-full text-xs bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={!newTitle.trim() || adding}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white transition-colors"
                    >
                        {adding ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <FileText className="w-3 h-3" />
                        )}
                        Record Decision
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
            ) : decisions.length === 0 ? (
                <p className="text-xs text-slate-500">No decisions recorded yet.</p>
            ) : (
                <div className="space-y-3">
                    {decisions.map((d) => (
                        <div
                            key={d.id}
                            className="rounded-xl bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-500/15 p-4 group relative"
                        >
                            <span className="inline-block text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md mb-2.5 uppercase tracking-wide">
                                Decision
                            </span>

                            <h4 className="text-sm font-semibold text-white mb-1">
                                {d.title}
                            </h4>

                            {d.description && (
                                <p className="text-xs text-slate-400 leading-relaxed mb-2"
                                    dangerouslySetInnerHTML={{
                                        __html: d.description
                                            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-300 font-medium">$1</strong>')
                                            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                                            .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
                                            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>')
                                    }}
                                />
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span>by {d.createdBy.fullName}</span>
                                <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* Delete */}
                            <button
                                onClick={() => handleDelete(d.id)}
                                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
