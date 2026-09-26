import { useContext } from 'react';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './AuthContext.types';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
