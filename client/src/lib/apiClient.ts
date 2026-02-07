import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  withCredentials: true, // sends refresh cookie
});


// request interceptor to add access token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// response interceptor to handle 401 and refresh token
let isRefreshing = false;
let queue: {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}[] = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      isRefreshing = true;

      try {
        const res = await apiClient.post("/auth/refresh");
        const newToken = res.data.accessToken;

        useAuthStore.setState({ accessToken: newToken });

        queue.forEach((p) => p.resolve(newToken));
        queue = [];

        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch (err) {
        queue.forEach((p) => p.reject(err));
        queue = [];
        useAuthStore.getState().clearAuth();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
