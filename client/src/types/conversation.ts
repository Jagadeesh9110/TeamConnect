export interface UserPublic {
  id: string;
  fullName: string;
  email: string;
}

export interface Participant {
  user: UserPublic;
}

export interface LastMessage {
  id: string;
  content: string;
  createdAt: string;
  status: string;
  senderId: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  type: "PRIVATE" | "GROUP";
  title?: string | null;
  participants: Participant[];
  messages?: LastMessage[];
  _count?: { messages: number };
  updatedAt?: string;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: UserPublic;
  editedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

export type ActionItemStatus = "OPEN" | "IN_PROGRESS" | "DONE";

export interface ActionItem {
  id: string;
  description: string;
  status: ActionItemStatus;
  conversationId: string;
  assignedTo?: UserPublic | null;
  createdBy: UserPublic;
  createdAt: string;
  updatedAt: string;
}

export interface Decision {
  id: string;
  title: string;
  description?: string | null;
  conversationId: string;
  createdBy: UserPublic;
  createdAt: string;
}

// Display-only status — derived on the client, never persisted
export type WorkstreamStatus = "DRAFT" | "ACTIVE" | "PENDING" | "RESOLVED";

/**
 * Derive a display status from conversation data.
 * No schema change — purely frontend logic.
 */
export function deriveWorkstreamStatus(conv: Conversation): WorkstreamStatus {
  const msgCount = conv._count?.messages ?? 0;
  if (msgCount === 0) return "DRAFT";

  const lastMsg = conv.messages?.[0];
  if (!lastMsg) return "PENDING";

  const lastMsgTime = new Date(lastMsg.createdAt).getTime();
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

  if (lastMsgTime > twentyFourHoursAgo) return "ACTIVE";
  return "PENDING";
}