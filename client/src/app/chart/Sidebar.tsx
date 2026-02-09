import { useEffect, useState } from "react";
import { getUserConversations } from "../../lib/api";
import {type Conversation } from "../../types/conversation";

interface SidebarProps {
  activeConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export default function Sidebar({
  activeConversation,
  onSelectConversation,
}: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await getUserConversations();
        setConversations(data);
      } catch {
        setError("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  return (
    <aside className="w-72 border-r border-white/5 bg-navy-800/60 backdrop-blur-xl">
      <div className="p-6">
        <h2 className="text-sm font-medium text-slate-400 mb-4">
          Conversations
        </h2>

        {loading && (
          <p className="text-sm text-slate-500">Loading conversations…</p>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="space-y-1">
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversation?.id;

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm
                  transition-colors
                  ${
                    isActive
                      ? "border-l-2 border-cyan-400 bg-white/5"
                      : "hover:bg-white/5 text-slate-300"
                  }
                `}
              >
                <div className="truncate">
                  {conv.type === "GROUP"
                    ? "Group Conversation"
                    : "Private Conversation"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
