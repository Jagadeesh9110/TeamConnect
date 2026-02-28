import { useEffect, useState } from "react";
import {
  getUserConversations,
  getUserWorkspaces,
  createWorkspace,
  getWorkspaceDetails,
} from "../../lib/api";
import {
  type Conversation,
  type WorkstreamStatus,
  deriveWorkstreamStatus,
} from "../../types/conversation";
import { useAuthStore } from "../../store/authStore";
import TeamConnectLogo from "../components/TeamConnectLogo";
import { Plus, Filter, LogOut } from "lucide-react";
import { logoutUser } from "../../lib/api";
import { useNavigate } from "react-router-dom";
import type { WorkspaceMemberResponse } from "../../types/workspace";
import {CreateConversationModal} from "./CreateConversationModal";

interface WorkstreamListProps {
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
}

export default function WorkstreamList({
  activeConversation,
  onSelectConversation,
}: WorkstreamListProps) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  // workspace state
  const [workspaces, setWorkspaces] = useState<WorkspaceMemberResponse[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaceDetails, setWorkspaceDetails] = useState<any>(null);

   // workspace loading/error states
  const [workspaceError, setWorkspaceError] = useState("");
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

 // conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [conversationModalOpen, setConversationModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getUserWorkspaces();
        setWorkspaces(data);

        if (data.length > 0) {
          setActiveWorkspaceId(data[0].workspace.id);
        }
      } catch {
        setWorkspaceError("Failed to load workspaces");
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    const loadDetails = async () => {
      try {
        const details = await getWorkspaceDetails(activeWorkspaceId);
        setWorkspaceDetails(details);
      } catch {
        console.error("Failed to load workspace details");
      }
    };

    loadDetails();
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    const load = async () => {
      setLoadingConversations(true);
      setConversationError("");

      try {
        const data = await getUserConversations(activeWorkspaceId);
        setConversations(data);
      } catch {
        setConversationError("Failed to load conversations");
      } finally {
        setLoadingConversations(false);
      }
    };

    load();
  }, [activeWorkspaceId]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim() || creating) return;

    setWorkspaceError("");

    try {
      setCreating(true);

      const workspace = await createWorkspace(newWorkspaceName.trim());

      setWorkspaces((prev) => [...prev, { workspace }]);
      setActiveWorkspaceId(workspace.id);

      setNewWorkspaceName("");
      setModalOpen(false);
    } catch (err: any) {
      setWorkspaceError(
        err?.response?.data?.error || "Failed to create workspace"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    clearAuth();
    navigate("/login");
  };

  return (
    <aside className="w-[240px] flex flex-col border-r border-white/5 bg-[#0c1527]">

      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <TeamConnectLogo className="w-7 h-7" />
          <div>
            <p className="text-sm font-semibold text-white">TeamConnect</p>
            <p className="text-[11px] text-slate-400">Engineering</p>
          </div>
        </div>
      </div>

      {/* Workspaces */}
      <div className="px-3 pt-5">
        <div className="flex justify-between mb-3 px-1">
          <span className="text-[11px] text-slate-400 uppercase">
            Workspaces
          </span>
          <button onClick={() => setModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {workspaceError && (
          <p className="text-xs text-red-400 px-1">{workspaceError}</p>
        )}

        <div className="space-y-1">
          {workspaces.map((wm) => (
            <button
              key={wm.workspace.id}
              onClick={() => setActiveWorkspaceId(wm.workspace.id)}
              className="w-full text-left px-2 py-2 rounded-md text-sm text-slate-300 hover:bg-white/5"
            >
              {wm.workspace.name}
            </button>
          ))}
        </div>

        {modalOpen && (
          <div className="mt-3">
            <input
              autoFocus
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
              placeholder="Workspace name"
              className="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded-md text-white"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreateWorkspace}
                disabled={creating}
                className="px-2 py-1 text-xs bg-blue-600 rounded-md"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-2 py-1 text-xs bg-slate-700 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Conversations */}
      <div className="px-3 pt-6 flex-1 overflow-y-auto">
        <div className="flex justify-between mb-3 px-1">
          <span className="text-[11px] text-slate-400 uppercase">
            Workstreams
          </span>
          <button onClick={() => setConversationModalOpen(true)}>
             <Plus className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {/* <Filter className="w-3.5 h-3.5 text-slate-400" /> */}
        </div>

        {loadingConversations && (
          <p className="text-xs text-slate-500 px-1">Loading…</p>
        )}
        {conversationError && (
          <p className="text-xs text-red-400 px-1">{conversationError}</p>
        )}

        {conversations.map((conv) => {
          const isActive = conv.id === activeConversation?.id;
          const status = deriveWorkstreamStatus(conv);

          const name =
            conv.type === "GROUP"
              ? "Group Discussion"
              : conv.participants.map((p) => p.user.fullName).join(", ");

          return (+
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className={`w-full text-left px-2 py-2 rounded-md ${
                isActive ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <span className="text-sm text-white">{name}</span>
              <span className="block text-[10px] text-slate-400">
                {status}
              </span>
            </button>
          );
        })}

        {conversationModalOpen && activeWorkspaceId  && (
          <CreateConversationModal
            workspaceId={activeWorkspaceId}
            onClose={() => setConversationModalOpen(false)}
            onConversationCreated={(conv) => {
              setConversations((prev) => [conv, ...prev]);
              onSelectConversation(conv);
            }}
          />
        )}

        {!loadingConversations && conversations.length === 0 && (
          <p className="text-xs text-slate-500 px-1">
            No conversations yet
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">{user?.fullName}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <button onClick={handleLogout}>
            <LogOut className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}