/* Knowledge Hub right panel — all content is mock/static */

import { RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import ActionItems from "./ActionItems";
import DecisionLog from "./DecisionLog";

const summaryBullets = [
    "Team is evaluating **Postgres** vs **DynamoDB** for audit logs.",
    "Key constraints: 7-year retention and 5k/sec write throughput.",
    "Current consensus leans towards Postgres due to relational needs for compliance, contingent on performance benchmarking.",
];

interface KnowledgeHubProps {
    expanded: boolean;
    onToggle: () => void;
}

export default function KnowledgeHub({ expanded, onToggle }: KnowledgeHubProps) {
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
                        <button className="text-slate-500 hover:text-slate-300 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="space-y-2.5 pl-1 border-l-2 border-blue-500/20">
                        {summaryBullets.map((bullet, i) => (
                            <p
                                key={i}
                                className="text-xs text-slate-400 leading-relaxed pl-3"
                                dangerouslySetInnerHTML={{
                                    __html: bullet.replace(
                                        /\*\*(.*?)\*\*/g,
                                        '<span class="text-slate-200 font-medium">$1</span>'
                                    ),
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* ─ Action Items ───────────────────────────────────────── */}
                <ActionItems />

                {/* ─ Decision Log ───────────────────────────────────────── */}
                <DecisionLog />
            </div>
        </aside>
    );
}
