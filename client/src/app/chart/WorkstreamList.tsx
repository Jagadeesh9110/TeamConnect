import { useEffect, useState, useRef } from "react";
import {
  getUserConversations,
  getUserWorkspaces,
  createWorkspace,
  logoutUser,
} from "../../lib/api";
import { joinWorkspace } from "../../lib/socket";
import {
  type Conversation,
  deriveWorkstreamStatus,
} from "../../types/conversation";
import { useAuthStore } from "../../store/authStore";
import TeamConnectLogo from "../components/TeamConnectLogo";
import { Plus, Settings, LogOut, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { WorkspaceMemberResponse } from "../../types/workspace";
import { CreateConversationModal } from "./CreateConversationModal";
import WorkspaceSettingsModal from "./WorkspaceSettingsModal";

interface WorkstreamListProps {
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation | null) => void;
  onOwnershipResolved?: (isOwner: boolean) => void;
}

export default function WorkstreamList({
  activeConversation,
  onSelectConversation,
  onOwnershipResolved,
}: WorkstreamListProps) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  // localStorage keys
  const LS_WORKSPACE = "tc_activeWorkspaceId";
  const LS_CONVERSATION = "tc_activeConversationId";

  // workspace state
  const [workspaces, setWorkspaces] = useState<WorkspaceMemberResponse[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // workspace loading/error states
  const [workspaceError, setWorkspaceError] = useState("");
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [conversationModalOpen, setConversationModalOpen] = useState(false);

  // user profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getUserWorkspaces();
        setWorkspaces(data);

        if (data.length > 0) {
          // Restore saved workspace or fallback to first
          const savedId = localStorage.getItem(LS_WORKSPACE);
          const match = savedId
            ? data.find((wm) => wm.workspace.id === savedId)
            : null;
          const target = match ?? data[0];

          setActiveWorkspaceId(target.workspace.id);
          localStorage.setItem(LS_WORKSPACE, target.workspace.id);

          // Resolve ownership
          const members = target.workspace.members ?? [];
          const ownership = members.some(
            (m: any) => m.userId === user?.id && m.role === "OWNER"
          );
          onOwnershipResolved?.(ownership);
        }
      } catch {
        setWorkspaceError("Failed to load workspaces");
      }
    };

    load();
  }, []);



  useEffect(() => {
    if (!activeWorkspaceId) return;

    // Persist workspace selection
    localStorage.setItem(LS_WORKSPACE, activeWorkspaceId);

    // Join socket room for presence updates
    joinWorkspace(activeWorkspaceId);

    const load = async () => {
      setLoadingConversations(true);
      setConversationError("");

      try {
        const data = await getUserConversations(activeWorkspaceId);
        setConversations(data);

        // Auto-select: restore saved conversation or pick first (most recent)
        if (data.length > 0) {
          const savedConvId = localStorage.getItem(LS_CONVERSATION);
          const match = savedConvId
            ? data.find((c: Conversation) => c.id === savedConvId)
            : null;
          const target = match ?? data[0];
          onSelectConversation(target);
          localStorage.setItem(LS_CONVERSATION, target.id);
        } else {
          onSelectConversation(null);
        }
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
    } catch { }
    clearAuth();
    navigate("/login");
  };

  const handleWorkspaceDeleted = async () => {
    setSettingsOpen(false);
    onSelectConversation(null); // clear stale active conversation
    try {
      const data = await getUserWorkspaces();
      setWorkspaces(data);
      if (data.length > 0) {
        setActiveWorkspaceId(data[0].workspace.id);
      } else {
        setActiveWorkspaceId(null);
        setConversations([]);
      }
    } catch {
      setWorkspaceError("Failed to refresh workspaces");
    }
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
          <div className="flex items-center gap-1">
            {activeWorkspaceId && (
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setConversationModalOpen(false); // prevent modal stacking
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                title="Workspace settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => setModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200 transition-colors" />
            </button>
          </div>
        </div>

        {workspaceError && (
          <p className="text-xs text-red-400 px-1">{workspaceError}</p>
        )}

        <div className="space-y-1">
          {workspaces.map((wm) => (
            <button
              key={wm.workspace.id}
              onClick={() => {
                setActiveWorkspaceId(wm.workspace.id);
                // Re-resolve ownership for the new workspace
                const members = wm.workspace.members ?? [];
                const ownership = members.some(
                  (m) => m.userId === user?.id && m.role === "OWNER"
                );
                onOwnershipResolved?.(ownership);
              }}
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
          <button onClick={() => {
            setConversationModalOpen(true);
            setSettingsOpen(false); // prevent modal stacking
          }}>
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

          const others = conv.participants.filter((p) => p.user.id !== user?.id);
          const name = conv.title
            ? conv.title
            : others.length > 0 
              ? others.map((p) => p.user.fullName).join(", ")
              : "Just You";

          return (
            <button
              key={conv.id}
              onClick={() => {
                onSelectConversation(conv);
                localStorage.setItem(LS_CONVERSATION, conv.id);
              }}
              className={`w-full text-left px-2 py-2 rounded-md ${isActive ? "bg-white/10" : "hover:bg-white/5"
                }`}
            >
              <span className="text-sm text-white">{name}</span>
              <span className="block text-[10px] text-slate-400">
                {status}
              </span>
            </button>
          );
        })}

        {conversationModalOpen && activeWorkspaceId && (
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

      {/* Workspace Settings Modal */}
      {settingsOpen && activeWorkspaceId && (
        <WorkspaceSettingsModal
          workspaceId={activeWorkspaceId}
          onClose={() => setSettingsOpen(false)}
          onWorkspaceDeleted={handleWorkspaceDeleted}
        />
      )}

      {/* Footer — User Profile */}
      <div className="px-4 py-3 border-t border-white/5 relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm text-white truncate">{user?.fullName}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <ChevronUp
            className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""
              }`}
          />
        </button>

        {/* Dropdown */}
        {profileOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-[#0e1829] border border-white/10 rounded-lg shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-sm font-medium text-white">{user?.fullName}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}