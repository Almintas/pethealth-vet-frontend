import { ApolloProvider } from '@apollo/client/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './features/auth';
import './i18n';
import './index.css';
import App from './app/App';
import { apolloClient } from './services/apollo';
import { ThemeProvider } from './theme';
import { applyThemePreference } from './theme/apply-theme';
import { readStoredThemePreference } from './theme/theme-storage';

applyThemePreference(readStoredThemePreference());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ApolloProvider client={apolloClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ApolloProvider>
    </ThemeProvider>
  </StrictMode>,
);
