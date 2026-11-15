import type {
  AuthUser,
  LoginInput,
  RegisterVeterinarianInput,
  RegisterWithInvitationInput,
} from './types';

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterVeterinarianInput) => Promise<void>;
  registerWithInvitation: (input: RegisterWithInvitationInput) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
};
