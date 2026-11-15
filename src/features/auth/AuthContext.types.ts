import type {
  AuthUser,
  LoginInput,
  LoginResult,
  RegisterVeterinarianInput,
  RegisterWithInvitationInput,
} from './types';

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  /** Resolves with the next step; signs in unless a 2FA code is needed. */
  login: (input: LoginInput) => Promise<LoginResult>;
  verifyTwoFactor: (twoFactorToken: string, code: string) => Promise<void>;
  /** Re-reads the signed-in user (e.g. after changing 2FA settings). */
  refreshUser: () => Promise<void>;
  register: (input: RegisterVeterinarianInput) => Promise<void>;
  registerWithInvitation: (input: RegisterWithInvitationInput) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
};
