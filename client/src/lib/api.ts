import { apiClient } from "./apiClient";

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

  return res.data; // { success, data: { message, user } }
};

export const loginUser = async (email: string, password: string) => {
  const res = await apiClient.post("/api/auth/login", { email, password });

  return res.data; // { success, accessToken, data: { user } }
};

export const logoutUser = async () => {
  await apiClient.post("/api/auth/logout");
};

export const getMe = async () => {
  const res = await apiClient.get("/api/auth/me");

  return res.data.user; // user
};


// conversations

// create private conversation
export const createPrivateConversation = async (participantId: string) => {
  const res = await apiClient.post("/api/conversations/private", {
    participantId,
  });

  return res.data; // { success, data: { conversation, isNew, message } }
};

// get user conversations
export const getUserConversations = async () => {
  const res = await apiClient.get("/api/conversations");

  return res.data.data.conversations; // Conversation[]
};


// messages

// send message
export const sendMessage = async (
  conversationId: string,
  content: string
) => {
  const res = await apiClient.post(`/api/messages/${conversationId}`, {
    content,
  });

  return res.data.data.message; // Message
};

// Get all messages for a conversation
export const getMessagesForConversation = async (
  conversationId: string
) => {
  const res = await apiClient.get(`/api/messages/${conversationId}`);

  return res.data.data.messages; // Message[]
};
