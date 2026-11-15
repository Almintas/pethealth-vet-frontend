import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AuthFormField } from '../components/AuthFormField';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../useAuth';
import { getAuthErrorMessage } from '../utils/get-auth-error-message';
import {
  hasFieldErrors,
  validateLoginForm,
  type FieldErrors,
  type LoginField,
} from '../utils/validation';

export function LoginPage() {
  const { t } = useTranslation();
  const { login, verifyTwoFactor } = useAuth();
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validationErrors = validateLoginForm({ email, password });
    setFieldErrors(validationErrors);
    if (hasFieldErrors(validationErrors)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
      });
      if (result.status === 'two-factor-required') {
        setTwoFactorToken(result.twoFactorToken);
      }
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'auth'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!twoFactorToken) {
      return;
    }
    setFormError(null);
    if (code.trim().length < 6) {
      setFormError(t('twoFactor.codeRequired'));
      return;
    }
    setIsSubmitting(true);
    try {
      await verifyTwoFactor(twoFactorToken, code.trim());
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'auth'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (twoFactorToken) {
    return (
      <AuthShell title={t('twoFactor.loginTitle')} subtitle={t('twoFactor.loginSubtitle')}>
        <form className="auth-form" onSubmit={handleCodeSubmit} noValidate>
          {formError ? (
            <p className="auth-alert" role="alert">
              {formError}
            </p>
          ) : null}
          <AuthFormField
            id="login-two-factor-code"
            name="code"
            label={t('twoFactor.codeLabel')}
            autoComplete="one-time-code"
            inputMode="text"
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value)}
            disabled={isSubmitting}
          />
          <p className="auth-card__subtitle">{t('twoFactor.recoveryHint')}</p>
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('auth.signingIn') : t('twoFactor.verify')}
          </button>
        </form>
        <p className="auth-switch">
          <button
            type="button"
            className="auth-switch__button"
            onClick={() => {
              setTwoFactorToken(null);
              setCode('');
              setPassword('');
              setFormError(null);
            }}
          >
            {t('twoFactor.startOver')}
          </button>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('auth.welcomeBack')}
      subtitle={t('auth.signInSubtitle')}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <p className="auth-alert" role="alert">
            {formError}
          </p>
        ) : null}

        <AuthFormField
          id="login-email"
          name="email"
          type="email"
          label={t('auth.email')}
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          disabled={isSubmitting}
        />

        <AuthFormField
          id="login-password"
          name="password"
          type="password"
          label={t('auth.password')}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          disabled={isSubmitting}
        />

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      <p className="auth-switch">
        {t('auth.noAccount')}{' '}
        <Link className="auth-switch__button" to="/register">
          {t('auth.createOne')}
        </Link>
      </p>
    </AuthShell>
  );
}
