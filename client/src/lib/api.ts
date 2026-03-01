import { apiClient } from "./apiClient";
import { type AxiosResponse } from "axios";
import { type Conversation } from "../types/conversation";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiError = {
  success: false;
  error: string;
};


function extractData<T>(res: AxiosResponse<ApiSuccess<T> | ApiError>): T {
  if (!res.data.success) {
    throw new Error(res.data.error);
  }
  return res.data.data;
}

// Auth
export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  const res = await apiClient.post("/api/auth/register", {
    fullName: name,
    email,
    password,
  });

  return extractData(res);
};

export const loginUser = async (email: string, password: string) => {
  const res = await apiClient.post("/api/auth/login", { email, password });
  return extractData(res);
};

export const logoutUser = async () => {
  const res = await apiClient.post("/api/auth/logout");
  return extractData(res);
};

export const getMe = async () => {
  const res = await apiClient.get("/api/auth/me");
  const data = extractData<{ user: any }>(res);
  return data.user;
};


// workspaces
export const createWorkspace = async (name: string) => {
  const res = await apiClient.post("/api/workspaces", { name });
  const data = extractData<{ workspace: any }>(res);
  return data.workspace;
};

export const getUserWorkspaces = async () => {
  const res = await apiClient.get("/api/workspaces");
  const data = extractData<{ workspaces: any[] }>(res);
  return data.workspaces;
};

export const getWorkspaceDetails = async (workspaceId: string) => {
  const res = await apiClient.get(`/api/workspaces/${workspaceId}`);
  const data = extractData<{ workspace: any }>(res);
  return data.workspace;
};

export const getWorkspaceMembers = async (workspaceId: string) => {
  const res = await apiClient.get(
    `/api/workspaces/${workspaceId}/members`
  );
  const data = extractData<{ members: any[] }>(res);
  return data.members;
};

export const addMemberToWorkspace = async (
  workspaceId: string,
  participantIds: string[]
) => {
  const res = await apiClient.post(
    `/api/workspaces/${workspaceId}/members`,
    { participantIds }
  );

  return extractData(res);
};

export const removeMemberFromWorkspace = async (
  workspaceId: string,
  userId: string
) => {
  const res = await apiClient.delete(
    `/api/workspaces/${workspaceId}/members/${userId}`
  );

  return extractData(res);
};

export const deleteWorkspace = async (workspaceId: string) => {
  const res = await apiClient.delete(`/api/workspaces/${workspaceId}`);
  return extractData(res);
};

// conversations
export const createPrivateConversation = async (
  workspaceId: string,
  participantId: string
): Promise<{
  conversation: Conversation;
  isNew: boolean;
  message: string;
}> => {
  const res = await apiClient.post("/api/conversations/private", {
    workspaceId,
    participantId,
  });

  return extractData(res);// { conversation, isNew, message }
};

export const createGroupConversation = async (
  workspaceId: string,
  participantIds: string[],
  title: string
): Promise<{
  conversation: Conversation;
  isNew: boolean;
  message: string;
}> => {
  const res = await apiClient.post("/api/conversations/group", {
    workspaceId,
    participantIds,
    title,
  });

  return extractData(res);
};

export const getUserConversations = async (workspaceId: string) => {
  const res = await apiClient.get("/api/conversations", {
    params: { workspaceId },
  });

  const data = extractData<{ conversations: any[] }>(res);
  return data.conversations;
};

// conversation title update
export const updateConversationTitle = async (
  conversationId: string,
  title: string
): Promise<{ conversation: Conversation }> => {
  const res = await apiClient.patch(
    `/api/conversations/${conversationId}/title`,
    { title }
  );

  return extractData(res);
};

// messages
export const sendMessage = async (
  conversationId: string,
  content: string
) => {
  const res = await apiClient.post("/api/messages", {
    conversationId,
    content,
  });

  return extractData(res);
};

export const getMessagesForConversation = async (
  conversationId: string
) => {
  const res = await apiClient.get(
    `/api/messages/${conversationId}/messages`
  );

  const data = extractData<{ messages: any[] }>(res);
  return data.messages;
};
