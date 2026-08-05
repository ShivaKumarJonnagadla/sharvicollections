import { create } from 'zustand';
import type { AuthUserDTO } from '@sharvi/shared';
import { api } from '@/lib/api';

interface AuthState {
  user: AuthUserDTO | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

/** Admin auth state. Tokens live in HttpOnly cookies — we only keep the user. */
export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  login: async (email, password) => {
    const { user } = await api.post<{ user: AuthUserDTO }>('/auth/login', { email, password });
    set({ user, status: 'authenticated' });
  },
  logout: async () => {
    await api.post('/auth/logout').catch(() => undefined);
    set({ user: null, status: 'unauthenticated' });
  },
  fetchMe: async () => {
    set({ status: 'loading' });
    try {
      const { user } = await api.get<{ user: AuthUserDTO }>('/auth/me');
      set({ user, status: 'authenticated' });
    } catch {
      set({ user: null, status: 'unauthenticated' });
    }
  },
}));
