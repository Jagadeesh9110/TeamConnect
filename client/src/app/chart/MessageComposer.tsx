import { useState, useRef, useCallback } from "react";
import { sendMessage } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { type Message } from "../../types/conversation";
import { emitTypingStart, emitTypingStop } from "../../lib/socket";
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

    // Typing indicator debounce
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTyping = useRef(false);

    const handleTyping = useCallback(() => {
        if (!conversationId) return;

        if (!isTyping.current) {
            isTyping.current = true;
            emitTypingStart(conversationId);
        }

        // Reset the stop timer
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            isTyping.current = false;
            emitTypingStop(conversationId);
        }, 2000);
    }, [conversationId]);

    const handleSend = async () => {
        if (!conversationId || !content.trim() || !currentUser) return;

        const text = content.trim();

        // Stop typing on send
        if (isTyping.current && conversationId) {
            isTyping.current = false;
            emitTypingStop(conversationId);
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
        }

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
            await sendMessage(conversationId, text);
        } catch (err) {
            console.error("Failed to send message:", err);
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
                    onChange={(e) => { setContent(e.target.value); handleTyping(); }}
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