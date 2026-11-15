import { createContext } from 'react';
import type { ResolvedTheme, ThemePreference } from './theme-storage';

export type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  resolvedTheme: ResolvedTheme;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);
