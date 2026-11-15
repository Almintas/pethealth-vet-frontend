import type { AuthUser, LoginInput, RegisterVeterinarianInput } from './types';

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterVeterinarianInput) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
};
