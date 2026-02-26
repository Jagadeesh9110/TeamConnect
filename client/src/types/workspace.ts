export interface WorkspaceUser {
  id: string;
  fullName: string;
  email: string;
}

export interface WorkspaceMember {
  userId: string;
  role: "OWNER" | "MEMBER";
  user: WorkspaceUser;
}

export interface Workspace {
  id: string;
  name: string;
  members: WorkspaceMember[];
}

export interface WorkspaceMemberResponse {
  workspace: Workspace;
}