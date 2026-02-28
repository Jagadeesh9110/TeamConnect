import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  withCredentials: true,
});

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // If refresh fails → logout
    if (originalRequest?.url?.includes("/api/auth/refresh")) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          "/api/auth/refresh",
          {},
          { baseURL: apiClient.defaults.baseURL, withCredentials: true }
        );

        const newAccessToken = res.data.data.accessToken;

        useAuthStore.setState({ accessToken: newAccessToken });

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (err) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);