export default function Sidebar() {
    return (
        <aside className="w-72 border-r border-white/5 bg-navy-800/60 backdrop-blur-xl">
            <div className="p-6">
                <h2 className="text-sm font-medium text-slate-400 mb-4">
                    Conversations
                </h2>

                {/* Placeholder items */}
                <div className="space-y-2">
                    <div className="rounded-lg px-3 py-2 bg-white/5 text-sm">
                        Product Discussion
                    </div>
                    <div className="rounded-lg px-3 py-2 hover:bg-white/5 text-sm text-slate-300">
                        Backend Architecture
                    </div>
                </div>
            </div>
        </aside>
    );
}