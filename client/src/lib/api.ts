import { apiClient } from "./apiClient";

/**
 * ======================================
 * API RESPONSE CONTRACT
 * ======================================
 * All backend responses follow:
 *
 * Success:
 * {
 *   success: true,
 *   data: T
 * }
 *
 * Error:
 * {
 *   success: false,
 *   error: string
 * }
 *
 * This file always returns `res.data.data`
 * so UI components receive only business payload (T).
 */


// authentication

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

  return res.data.data; // { message, user }
};

export const loginUser = async (email: string, password: string) => {
  const res = await apiClient.post("/api/auth/login", { email, password });
  return res.data.data; // { accessToken, user }
};

export const logoutUser = async () => {
  const res = await apiClient.post("/api/auth/logout");
  return res.data.data; // { message }
};

export const getMe = async () => {
  const res = await apiClient.get("/api/auth/me");
  return res.data.data.user;
};


// workspaces

export const createWorkspace = async (name: string) => {
  const res = await apiClient.post("/api/workspaces", { name });
  return res.data.data.workspace;
};

export const getUserWorkspaces = async () => {
  const res = await apiClient.get("/api/workspaces");
  return res.data.data.workspaces;
};

export const getWorkspaceDetails = async (workspaceId: string) => {
  const res = await apiClient.get(`/api/workspaces/${workspaceId}`);
  return res.data.data.workspace;
};

export const addMemberToWorkspace = async (
  workspaceId: string,
  participantIds: string[]
) => {
  const res = await apiClient.post(
    `/api/workspaces/${workspaceId}/members`,
    { participantIds }
  );
  return res.data.data.message;
};

export const removeMemberFromWorkspace = async (
  workspaceId: string,
  userId: string
) => {
  const res = await apiClient.delete(
    `/api/workspaces/${workspaceId}/members/${userId}`
  );
  return res.data.data.message;
};

export const deleteWorkspace = async (workspaceId: string) => {
  const res = await apiClient.delete(`/api/workspaces/${workspaceId}`);
  return res.data.data.message;
};


// conversations

export const createPrivateConversation = async (
  workspaceId: string,
  participantId: string
) => {
  const res = await apiClient.post("/api/conversations/private", {
    workspaceId,
    participantId,
  });
   // res.data.data -> { conversation, isNew, message }
   return res.data.conversation; 
};

export const createGroupConversation= async (workspaceId: string, participantIds: string[], title: string) => {
   const res=await apiClient.post("/api/conversations/group",{
    workspaceId,
    participantIds,
    title
   });
   // res.data.data -> { conversation, isNew, message }
   return res.data.conversation; 
}

export const getUserConversations = async (workspaceId: string) => {
  const res = await apiClient.get("/api/conversations", {
    params: { workspaceId },
  });

  return res.data.data.conversations;
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

  return res.data.data.message;
};

export const getMessagesForConversation = async (
  conversationId: string
) => {
  const res = await apiClient.get(
    `/api/messages/${conversationId}/messages`
  );

  return res.data.data.messages;
};