import { useState } from "react";
import { sendMessage } from "../../lib/chatApi";

interface MessageComposerProps {
    conversationId: string | null;
    onMessageSent: () => void;
}


export default function MessageComposer({
    conversationId,
    onMessageSent,
}: MessageComposerProps) {

    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const handleSend = async () => {
        if (!conversationId || !content.trim()) return;

        try {
            setSending(true);
            setError("");

            await sendMessage(conversationId, content.trim());

            setContent("");
            onMessageSent();
        } catch {
            setError("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="border-t border-white/5 px-6 py-4 bg-navy-900/80 backdrop-blur">
            {error && (
                <p className="text-xs text-red-400 mb-2">{error}</p>
            )}
            <div className="flex items-end gap-3">
                <textarea
                    rows={2}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={!conversationId || sending}
                    placeholder={
                        conversationId
                            ? "Write a message or document a decision…"
                            : "Select a conversation to begin"
                    }
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
            disabled:opacity-50
          "
                />
                <button
                onClick={handleSend}
                disabled={!conversationId || sending || !content.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50  disabled:cursor-not-allowed text-sm font-medium">
                    {sending ? "Sending…" : "Send"}
                </button>
            </div>
        </div>
    );
}