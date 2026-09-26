import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { applyThemePreference } from './apply-theme';
import { ThemeContext } from './theme-context';
import {
  readStoredThemePreference,
  resolveTheme,
  writeStoredThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from './theme-storage';

type ThemeProviderProps = {
  children: ReactNode;
};

const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemePreference>(() =>
    readStoredThemePreference(),
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredThemePreference()),
  );

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    writeStoredThemePreference(next);
    const resolved = applyThemePreference(next);
    setResolvedTheme(resolved);
  }, []);

  useEffect(() => {
    applyThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') {
      return;
    }

    const media = window.matchMedia(SYSTEM_THEME_QUERY);

    const handleChange = () => {
      const resolved = applyThemePreference('system');
      setResolvedTheme(resolved);
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
    }),
    [theme, setTheme, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
