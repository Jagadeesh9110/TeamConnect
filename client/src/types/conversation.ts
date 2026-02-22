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
  type: "PRIVATE" | "GROUP";
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