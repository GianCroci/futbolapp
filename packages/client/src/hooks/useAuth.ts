import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function useAuth() {
  const {
    isAuthenticated,
    isLoading: auth0Loading,
    loginWithRedirect,
    logout: auth0Logout,
    getIdTokenClaims,
    user: auth0User,
  } = useAuth0();

  const { setUser, setAccessToken, setLoading, logout: clearStore } = useAuthStore();
  const syncedRef = useRef(false);

  useEffect(() => {
    async function syncUser() {
      if (!isAuthenticated || !auth0User) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Set user immediately from Auth0 profile so the UI works right away
      setUser({
        id: auth0User.sub || '',
        email: auth0User.email || '',
        name: auth0User.name || auth0User.email || '',
        picture: auth0User.picture || null,
      });
      setLoading(false);

      // Then sync with server in background (creates user in DB if needed)
      if (syncedRef.current) return;
      syncedRef.current = true;

      try {
        // Use ID token instead of access token - simpler, no audience needed
        const idTokenClaims = await getIdTokenClaims();
        const token = idTokenClaims?.__raw;
        if (token) {
          setAccessToken(token);
          localStorage.setItem('auth_access_token', token);

          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
        }
      } catch (err) {
        console.warn('Server sync failed, using Auth0 profile:', err);
      }
    }

    syncUser();
  }, [isAuthenticated, auth0User, getIdTokenClaims, setUser, setAccessToken, setLoading]);

  const login = () => loginWithRedirect();

  const logout = () => {
    clearStore();
    syncedRef.current = false;
    localStorage.removeItem('auth_access_token');
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return {
    user: useAuthStore((s) => s.user),
    isLoading: auth0Loading || useAuthStore((s) => s.isLoading),
    error: useAuthStore((s) => s.error),
    isAuthenticated: !!useAuthStore((s) => s.user),
    login,
    logout,
  };
}
