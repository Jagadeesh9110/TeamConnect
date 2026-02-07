import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../lib/api';

// Hook to hydrate auth state on app mount
export function useAuthInit() {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const user = await getMe();
        setAuth(user, null as any); // token already handled by interceptor
      } catch {
        clearAuth();
      }
    };
    init();
  }, [setAuth, clearAuth, setLoading]);
}
