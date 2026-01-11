export default function MessageTimeline() {
    return (
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Message block */}
            <div className="max-w-3xl">
                <p className="text-sm text-slate-400 mb-1">
                    Test User · 10:42 AM
                </p>
                <div className="rounded-xl bg-white/5 px-4 py-3 text-sm leading-relaxed">
                    Let’s finalize the API structure before adding WebSockets.
                </div>
            </div>

            <div className="max-w-3xl">
                <p className="text-sm text-slate-400 mb-1">
                    Second User · 10:45 AM
                </p>
                <div className="rounded-xl bg-white/5 px-4 py-3 text-sm leading-relaxed">
                    Agreed. We should also define message persistence clearly.
                </div>
            </div>
        </main>
    );
}