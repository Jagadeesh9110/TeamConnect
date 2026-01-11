export default function ConversationHeader() {
    return (
        <header className="h-16 border-b border-white/5 flex items-center px-6 bg-navy-900/80 backdrop-blur">
            <div>
                <h1 className="text-base font-medium">
                    Product Discussion
                </h1>
                <p className="text-xs text-slate-400">
                    2 participants · Updated moments ago
                </p>
            </div>
        </header>
    );
}