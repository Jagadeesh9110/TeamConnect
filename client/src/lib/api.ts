import { apiClient } from "./apiClient";

export const registerUser = async (name: string, email: string, password: string) => {
  const res = await apiClient.post("/auth/register", { fullName: name, email, password });
  return res.data; // { message, user }
}

export const loginUser = async (email: string, password: string) => {
  const res = await apiClient.post("/auth/login", { email, password });
  return res.data; // { accessToken, user }
};

export const logoutUser = async () => {
  await apiClient.post("/auth/logout");
};

export const getMe = async () => {
  const res = await apiClient.get("/auth/me");
  return res.data.user;
};