import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AuthState, SpotifyUser } from '../types';

interface AuthStore extends AuthState {
  login: (user: SpotifyUser, accessToken: string, refreshToken: string, expiresIn: number) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  refreshSession: (accessToken: string, expiresIn: number) => void;
}

// Create auth store with persistence
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isLoading: false,
      error: null,

      login: (user, accessToken, refreshToken, expiresIn) => {
        const expiresAt = Date.now() + expiresIn * 1000;
        set({
          user,
          accessToken,
          refreshToken,
          expiresAt,
          isLoading: false,
          error: null,
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          isLoading: false,
          error: null,
        });
      },

      setError: (error) => {
        set({ error });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      refreshSession: (accessToken, expiresIn) => {
        const expiresAt = Date.now() + expiresIn * 1000;
        set((state) => ({
          ...state,
          accessToken,
          expiresAt,
        }));
      },
    }),
    {
      name: 'spotify-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// Export selectors for convenience
export const selectIsAuthenticated = (state: AuthStore) =>
  !!state.accessToken && !!state.expiresAt && state.expiresAt > Date.now();

export const selectNeedsTokenRefresh = (state: AuthStore) =>
  !!state.accessToken && !!state.expiresAt && state.expiresAt < Date.now() + 5 * 60 * 1000; // 5 minutes before expiry
