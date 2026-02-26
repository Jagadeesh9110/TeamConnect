import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../lib/api';
import { apiClient } from '../lib/apiClient';

// Hook to hydrate auth state on app mount
export function useAuthInit() {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        //  Force refresh first
        const refreshRes = await apiClient.post("/api/auth/refresh");
        const accessToken = refreshRes.data.data.accessToken;

        // Now get user (AUthorization header will be set by interceptor)
        const user = await getMe();
        
        // Single state update with both user and token
        setAuth(user, accessToken);

      } catch (err: any) {
        console.error("Failed to initialize auth:", err);
        clearAuth();
      }
    };

    init();
  }, [setAuth, clearAuth, setLoading]);
}
