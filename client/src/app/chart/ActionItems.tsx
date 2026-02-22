/* Static mock action items — no backend wiring */

const items = [
    {
        text: "Benchmark write speeds",
        assignee: "Alex Morgan",
        initials: "AM",
        color: "bg-blue-600",
        done: false,
    },
    {
        text: "Prototype partition schema",
        assignee: "David Kim",
        initials: "DK",
        color: "bg-teal-600",
        done: false,
    },
];

export default function ActionItems() {
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-base leading-none">✦</span> Action Items
                </h3>
                <button className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none">
                    +
                </button>
            </div>

            <div className="space-y-3">
                {items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                        {/* Checkbox */}
                        <div className="mt-0.5 w-4 h-4 rounded-full border border-slate-600 shrink-0" />

                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 leading-snug">
                                {item.text}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span
                                    className={`w-5 h-5 rounded-full ${item.color} flex items-center justify-center text-[9px] font-medium text-white shrink-0`}
                                >
                                    {item.initials}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                    {item.assignee}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
