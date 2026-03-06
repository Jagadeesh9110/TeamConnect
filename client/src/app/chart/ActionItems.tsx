import { useEffect, useState } from "react";
import {
    getActionItems,
    createActionItem,
    updateActionItem,
    deleteActionItem,
} from "../../lib/api";
import { type ActionItem, type ActionItemStatus } from "../../types/conversation";
import { getSocket } from "../../lib/socket";
import { Loader2, Plus, Trash2, Check, Circle, Clock } from "lucide-react";

const statusConfig: Record<ActionItemStatus, { icon: typeof Check; label: string; color: string }> = {
    OPEN: { icon: Circle, label: "Open", color: "text-slate-400" },
    IN_PROGRESS: { icon: Clock, label: "In Progress", color: "text-amber-400" },
    DONE: { icon: Check, label: "Done", color: "text-emerald-400" },
};

const statusCycle: ActionItemStatus[] = ["OPEN", "IN_PROGRESS", "DONE"];

interface ActionItemsProps {
    conversationId: string | null;
}

export default function ActionItems({ conversationId }: ActionItemsProps) {
    const [items, setItems] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newDesc, setNewDesc] = useState("");
    const [adding, setAdding] = useState(false);

    // Fetch action items when conversation changes
    useEffect(() => {
        if (!conversationId) {
            setItems([]);
            return;
        }

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const data = await getActionItems(conversationId);
                if (!cancelled) setItems(data.actionItems);
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

        const onCreated = (item: ActionItem) => {
            setItems((prev) => [item, ...prev]);
        };

        const onUpdated = (item: ActionItem) => {
            setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
        };

        const onDeleted = ({ id }: { id: string }) => {
            setItems((prev) => prev.filter((i) => i.id !== id));
        };

        socket.on("actionItem:created", onCreated);
        socket.on("actionItem:updated", onUpdated);
        socket.on("actionItem:deleted", onDeleted);

        return () => {
            socket.off("actionItem:created", onCreated);
            socket.off("actionItem:updated", onUpdated);
            socket.off("actionItem:deleted", onDeleted);
        };
    }, [conversationId]);

    const handleCreate = async () => {
        if (!conversationId || !newDesc.trim()) return;
        setAdding(true);
        try {
            const data = await createActionItem(conversationId, newDesc.trim());
            setItems((prev) => [data.actionItem, ...prev]);
            setNewDesc("");
            setShowAdd(false);
        } catch (err) {
            console.error("Failed to create action item:", err);
        } finally {
            setAdding(false);
        }
    };

    const handleCycleStatus = async (item: ActionItem) => {
        const currentIndex = statusCycle.indexOf(item.status);
        const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

        // Optimistic update
        setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i))
        );

        try {
            await updateActionItem(item.id, { status: nextStatus });
        } catch {
            // Revert on failure
            setItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i))
            );
        }
    };

    const handleDelete = async (itemId: string) => {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        try {
            await deleteActionItem(itemId);
        } catch {
            // Could revert, but for now let it be
        }
    };

    if (!conversationId) {
        return (
            <div>
                <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <span className="text-base leading-none">✦</span> Action Items
                </h3>
                <p className="text-xs text-slate-500">Select a conversation to view action items.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-base leading-none">✦</span> Action Items
                    {items.length > 0 && (
                        <span className="text-[10px] font-normal text-slate-500 ml-1">
                            ({items.filter(i => i.status !== "DONE").length} open)
                        </span>
                    )}
                </h3>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Add form */}
            {showAdd && (
                <div className="mb-3 flex gap-2">
                    <input
                        type="text"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        placeholder="New action item..."
                        className="flex-1 text-xs bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        autoFocus
                    />
                    <button
                        onClick={handleCreate}
                        disabled={!newDesc.trim() || adding}
                        className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white transition-colors"
                    >
                        {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <p className="text-xs text-slate-500">No action items yet.</p>
            ) : (
                <div className="space-y-2.5">
                    {items.map((item) => {
                        const cfg = statusConfig[item.status];
                        const StatusIcon = cfg.icon;
                        return (
                            <div key={item.id} className="flex items-start gap-2.5 group">
                                {/* Status toggle */}
                                <button
                                    onClick={() => handleCycleStatus(item)}
                                    className={`mt-0.5 shrink-0 transition-colors ${cfg.color} hover:opacity-80`}
                                    title={`Status: ${cfg.label} (click to cycle)`}
                                >
                                    <StatusIcon className="w-4 h-4" />
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-snug ${item.status === "DONE" ? "text-slate-500 line-through" : "text-slate-200"}`}>
                                        {item.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {item.assignedTo && (
                                            <span className="text-[10px] text-slate-500">
                                                → {item.assignedTo.fullName}
                                            </span>
                                        )}
                                        <span className={`text-[10px] ${cfg.color}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Delete */}
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
