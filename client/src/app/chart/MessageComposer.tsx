export default function MessageComposer() {
    return (
        <div className="border-t border-white/5 px-6 py-4 bg-navy-900/80 backdrop-blur">
            <div className="flex items-center gap-3">
                <textarea
                    rows={2}
                    placeholder="Write a message or ask the AI to summarize…"
                    className="
            flex-1 resize-none
            rounded-xl
            bg-white/5
            border border-white/10
            px-4 py-3
            text-sm
            text-white
            placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500/40
          "
                />
                <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium">
                    Send
                </button>
            </div>
        </div>
    );
}