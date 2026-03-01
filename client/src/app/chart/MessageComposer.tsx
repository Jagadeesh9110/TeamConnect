import { useState } from "react";
import { sendMessage } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { type Message } from "../../types/conversation";
import {
    Bold,
    Italic,
    Code,
    Link,
    ImageIcon,
    Send,
} from "lucide-react";

interface MessageComposerProps {
    conversationId: string | null;
    onMessageSent?: (message: Message) => void;
}

export default function MessageComposer({
    conversationId,
    onMessageSent,
}: MessageComposerProps) {
    const currentUser = useAuthStore((s) => s.user);
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!conversationId || !content.trim() || !currentUser) return;

        const text = content.trim();

        // Optimistic message — append immediately
        const optimisticMsg: Message = {
            id: `optimistic-${Date.now()}`,
            content: text,
            createdAt: new Date().toISOString(),
            sender: {
                id: currentUser.id,
                fullName: currentUser.fullName,
                email: currentUser.email,
            },
        };
        onMessageSent?.(optimisticMsg);
        setContent("");

        setSending(true);
        try {
            const result = await sendMessage(conversationId, text);
            // Replace optimistic message with server response
            // For now the optimistic one stays — server returns the real message
            // but since IDs differ, both would appear. We handle this by just
            // letting ChatLayout refetch or accepting the duplicate until sockets.
            // A simple approach: the server message will have a real ID.
        } catch (err) {
            console.error("Failed to send message:", err);
            // TODO: mark optimistic message as failed / remove it
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter to send, Shift+Enter for new line
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-white/5 px-6 py-4 bg-[#0e1829]/80 backdrop-blur shrink-0">
            {/* Static toolbar — icons are non-functional */}
            <div className="flex items-center gap-1 mb-2">
                {[Bold, Italic, Code, Link, ImageIcon].map((Icon, i) => (
                    <button
                        key={i}
                        className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                        tabIndex={-1}
                    >
                        <Icon className="w-4 h-4" />
                    </button>
                ))}
            </div>

            {/* Text area + send */}
            <div className="flex items-end gap-3">
                <textarea
                    rows={2}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!conversationId || sending}
                    placeholder={
                        conversationId
                            ? "Contribute to the decision…"
                            : "Select a workstream to begin"
                    }
                    className="
            flex-1 resize-none rounded-xl bg-white/5
            border border-white/10 px-4 py-3 text-sm
            text-white placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-blue-500/40
            disabled:opacity-50
          "
                />

                <button
                    onClick={handleSend}
                    disabled={!conversationId || !content.trim() || sending}
                    className="
            flex items-center gap-2 px-5 py-2.5 rounded-lg
            bg-blue-600 hover:bg-blue-700
            disabled:opacity-50 disabled:cursor-not-allowed
            text-sm font-medium text-white transition-colors
          "
                >
                    Send
                    <Send className="w-4 h-4" />
                </button>
            </div>

            {/* Hint */}
            <p className="text-[11px] text-slate-500 mt-2">
                Enter to send, Shift+Enter for new line
            </p>
        </div>
    );
}