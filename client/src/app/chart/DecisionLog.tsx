/* Static mock decision log — no backend wiring */

import { FileText } from "lucide-react";

export default function DecisionLog() {
    return (
        <div>
            <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <span className="text-base leading-none">✧</span> Decision Log
            </h3>

            {/* Single mock decision card */}
            <div className="rounded-xl bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-500/15 p-4">
                <span className="inline-block text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md mb-2.5 uppercase tracking-wide">
                    Draft Outcome
                </span>

                <h4 className="text-sm font-semibold text-white mb-1.5">
                    Use Partitioned Postgres 14
                </h4>

                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Contingent on benchmarks showing &lt; 50ms latency at peak load.
                    Provides best balance of relational integrity and scale.
                </p>

                <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors">
                    <FileText className="w-3.5 h-3.5" />
                    View ADR Draft
                </button>
            </div>
        </div>
    );
}
