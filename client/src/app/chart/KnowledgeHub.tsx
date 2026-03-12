/* Knowledge Hub right panel — wired to live data */

import { useState, useEffect } from "react";
import { Maximize2, Minimize2, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { getConversationSummary, summarizeConversation } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import ActionItems from "./ActionItems";
import DecisionLog from "./DecisionLog";

interface KnowledgeHubProps {
    expanded: boolean;
    onToggle: () => void;
    conversationId: string | null;
}

interface Summary {
    id: string;
    summary: string;
    createdAt: string;
}

export default function KnowledgeHub({ expanded, onToggle, conversationId }: KnowledgeHubProps) {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");

    // Fetch latest summary when conversation changes
    useEffect(() => {
        if (!conversationId) {
            setSummary(null);
            return;
        }

        let cancelled = false;
        const load = async () => {
            setLoadingSummary(true);
            setError("");
            try {
                const data = await getConversationSummary(conversationId);
                if (!cancelled) setSummary(data.summary);
            } catch {
                // Silently fail
            } finally {
                if (!cancelled) setLoadingSummary(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [conversationId]);

    // Socket listener for real-time summary updates
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !conversationId) return;

        const onGenerated = (newSummary: Summary) => {
            setSummary(newSummary);
        };

        socket.on("summary:generated", onGenerated);
        return () => {
            socket.off("summary:generated", onGenerated);
        };
    }, [conversationId]);

    const handleGenerate = async () => {
        if (!conversationId) return;
        setGenerating(true);
        setError("");
        try {
            const data = await summarizeConversation(conversationId);
            setSummary(data.summary);
        } catch (err: any) {
            setError(err?.message || "Failed to generate summary");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <aside
            className="shrink-0 border-l border-white/5 bg-[#0c1527] flex flex-col hidden lg:flex transition-all duration-300 ease-in-out"
            style={{ width: expanded ? "45%" : "35%" }}
        >
            {/* ─ Header ────────────────────────────────────────────────── */}
            <div className="px-5 pt-5 pb-4 border-b border-white/5 shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="text-amber-400 text-sm">✦</span> Knowledge Hub
                    </h2>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-slate-500 border border-white/10 rounded px-1.5 py-0.5 uppercase tracking-wide">
                            Ground Truth
                        </span>
                        <button
                            onClick={onToggle}
                            className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-white/5 transition-colors"
                            title={expanded ? "Reduce to default" : "Expand"}
                        >
                            {expanded ? (
                                <Minimize2 className="w-3.5 h-3.5" />
                            ) : (
                                <Maximize2 className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ─ Scrollable content ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5 space-y-6">
                {/* ─ Live Summary ────────────────────────────────────────── */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="text-base leading-none">📄</span> Live Summary
                        </h3>
                        {conversationId && (
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex items-center gap-1 text-[10px] font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
                                title="Generate AI summary from messages"
                            >
                                {generating ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : summary ? (
                                    <RefreshCw className="w-3 h-3" />
                                ) : (
                                    <Sparkles className="w-3 h-3" />
                                )}
                                {generating ? "Generating..." : summary ? "Regenerate" : "Generate Summary"}
                            </button>
                        )}
                    </div>

                    {!conversationId ? (
                        <p className="text-xs text-slate-500">Select a conversation to view summary.</p>
                    ) : loadingSummary ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        </div>
                    ) : error ? (
                        <p className="text-xs text-red-400">{error}</p>
                    ) : summary ? (
                        <div className="space-y-2.5 pl-1 border-l-2 border-blue-500/20">
                            {summary.summary.split("\n").filter(l => l.trim()).map((line, i) => (
                                <p
                                    key={i}
                                    className="text-xs text-slate-400 leading-relaxed pl-3"
                                    dangerouslySetInnerHTML={{
                                        __html: line
                                            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") // Escape HTML
                                            .replace(/^\s*[-•*]\s*/, "")
                                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-200 font-medium">$1</strong>')
                                            .replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>')
                                            .replace(/_(.*?)_/g, '<em class="italic text-slate-300">$1</em>')
                                            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>'),
                                    }}
                                />
                            ))}
                            <p className="text-[10px] text-slate-600 pl-3 pt-1">
                                Generated {new Date(summary.createdAt).toLocaleString()}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-gradient-to-br from-blue-900/20 to-indigo-900/10 border border-blue-500/10 p-4 text-center">
                            <Sparkles className="w-5 h-5 text-blue-400/60 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 mb-1">No summary yet</p>
                            <p className="text-[10px] text-slate-600">
                                Click "Generate Summary" to create an AI-powered summary of this conversation.
                            </p>
                        </div>
                    )}
                </div>

                {/* ─ Action Items ───────────────────────────────────────── */}
                <ActionItems conversationId={conversationId} />

                {/* ─ Decision Log ───────────────────────────────────────── */}
                <DecisionLog conversationId={conversationId} />
            </div>
        </aside>
    );
}
