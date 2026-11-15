import { useApolloClient } from '@apollo/client/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authService from './auth.service';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './AuthContext.types';
import type { AuthUser, LoginInput, RegisterVeterinarianInput } from './types';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const client = useApolloClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const currentUser = await authService.fetchCurrentUser(client);
      if (!cancelled) {
        setUser(currentUser);
        setIsInitializing(false);
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [client]);

  const login = useCallback(
    async (input: LoginInput) => {
      const authenticatedUser = await authService.login(client, input);
      setUser(authenticatedUser);
    },
    [client],
  );

  const register = useCallback(
    async (input: RegisterVeterinarianInput) => {
      const authenticatedUser = await authService.registerVeterinarian(
        client,
        input,
      );
      setUser(authenticatedUser);
    },
    [client],
  );

  const logout = useCallback(async () => {
    await authService.logout(client);
    setUser(null);
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login,
      register,
      logout,
      getAccessToken: authService.getAccessToken,
    }),
    [user, isInitializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
