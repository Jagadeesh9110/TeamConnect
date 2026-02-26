import { useEffect, useState } from "react";
import {createPrivateConversation,createGroupConversation,getWorkspaceMembers} from "../../lib/api";
import { type Conversation } from "../../types/conversation";
import { useAuthStore } from "../../store/authStore";

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CreateConversationModalProps {
  workspaceId: string;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export const CreateConversationModal = ({workspaceId,onClose,onConversationCreated}:CreateConversationModalProps) =>{
    const CurrentUser = useAuthStore((s) => s.user);

    const [members,setMembers]=useState<WorkspaceMember[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // load workspace members on mount
    useEffect(() => {
        const loadMembers = async () => {
            try {
                const members = await getWorkspaceMembers(workspaceId);

                 // Exclude current user
                const filtered = members.filter(
                    (m: WorkspaceMember) => m.id !== CurrentUser?.id
                );
                setMembers(filtered);
            } catch (err) {
                setError("Failed to load workspace members");
            }
        };
        loadMembers();
    }, [workspaceId,CurrentUser?.id]);

     const toggleUser = (userId: string) => {
      setSelectedUserIds((prev) =>
         prev.includes(userId)
           ? prev.filter((id) => id !== userId)
           : [...prev, userId]
       );
    };

    const handleCreate = async () => {
        if (selectedUserIds.length === 0) {
            setError("Select at least one participant");
            return;
        }

        if (selectedUserIds.length > 1 && !title.trim()) {
            setError("Group title is required");
            return;
        }

        try {
            setLoading(true);
            setError("");

            let conversation: Conversation;

            if (selectedUserIds.length === 1) {
                conversation = await createPrivateConversation(
                    workspaceId,
                    selectedUserIds[0]
                );
            } else {
                conversation = await createGroupConversation(
                    workspaceId,
                    selectedUserIds,
                    title.trim()
                );
            }

            onConversationCreated(conversation);
            onClose();
        } catch (err: any) {
            setError(
                err.response?.data?.error || "Failed to create conversation"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#0e1829] w-[400px] p-6 rounded-lg border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">
          Create Conversation
        </h2>

        {!loading && members.length === 0 && (
          <p className="text-sm text-slate-400 mb-3">
            No other members available
          </p>
        )}

        <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
          {members.map((member) => (
            <label
              key={member.id}
              className="flex items-center gap-2 text-sm text-slate-300"
            >
              <input
                type="checkbox"
                checked={selectedUserIds.includes(member.id)}
                onChange={() => toggleUser(member.id)}
              />
              {member.name}
            </label>
          ))}
        </div>

        {selectedUserIds.length > 1 && (
          <input
            type="text"
            placeholder="Group title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded-md text-white"
          />
        )}

        {error && (
          <p className="text-xs text-red-400 mb-2">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-slate-700 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-600 rounded-md"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );

};
