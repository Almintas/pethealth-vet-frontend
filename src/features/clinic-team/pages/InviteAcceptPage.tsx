import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../auth';
import { AuthFormField } from '../../auth/components/AuthFormField';
import { AuthShell } from '../../auth/components/AuthShell';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import { MY_CLINICS_QUERY } from '../../clinics/graphql';
import {
  ACCEPT_CLINIC_INVITATION_MUTATION,
  CLINIC_INVITATION_PREVIEW_QUERY,
} from '../graphql';
import type { ClinicInvitationPreview } from '../types';

/**
 * Landing page for clinic team invitations. Explains the invitation and lets
 * the invitee accept it: with their current session, by signing in, or by
 * creating an account right here.
 */
export function InviteAcceptPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const { user, isAuthenticated, isInitializing, logout } = useAuth();

  const { data, loading, error } = useQuery<{
    clinicInvitationPreview: ClinicInvitationPreview;
  }>(CLINIC_INVITATION_PREVIEW_QUERY, {
    variables: { token },
    skip: !token,
    fetchPolicy: 'network-only',
  });
  const preview = data?.clinicInvitationPreview;
  const nextPath = `/invite?token=${encodeURIComponent(token)}`;

  if (!token || (preview && preview.state !== 'VALID')) {
    const stateKey = preview?.state ?? 'EXPIRED';
    return (
      <AuthShell
        title={t('invite.unavailableTitle')}
        subtitle={t(`invite.states.${stateKey}`)}
      >
        <p className="auth-switch">
          <Link className="auth-switch__button" to="/login">
            {t('auth.signInLink')}
          </Link>
        </p>
      </AuthShell>
    );
  }

  if (loading || isInitializing || !preview) {
    return (
      <AuthShell title={t('invite.title')} subtitle={t('common.loading')}>
        {error ? (
          <p className="auth-alert" role="alert">
            {getAuthErrorMessage(error, 'generic-load')}
          </p>
        ) : null}
      </AuthShell>
    );
  }

  const roleLabel = preview.role ? t(`clinics.memberRoles.${preview.role}`) : '';
  const subtitle = t('invite.subtitle', {
    clinic: preview.clinicName ?? '',
    role: roleLabel,
    email: preview.email ?? '',
  });

  if (isAuthenticated && user) {
    if (user.email.toLowerCase() !== (preview.email ?? '').toLowerCase()) {
      return (
        <AuthShell title={t('invite.title')} subtitle={subtitle}>
          <p className="auth-alert" role="alert">
            {t('invite.wrongAccount', { current: user.email, invited: preview.email })}
          </p>
          <button
            type="button"
            className="auth-submit"
            onClick={() => void logout()}
          >
            {t('invite.signOutAndContinue')}
          </button>
        </AuthShell>
      );
    }
    return <AcceptWithSession token={token} subtitle={subtitle} />;
  }

  if (preview.accountExists) {
    return (
      <AuthShell title={t('invite.title')} subtitle={subtitle}>
        <p className="auth-card__subtitle">{t('invite.signInToAccept')}</p>
        <Link
          className="auth-submit"
          to={`/login?next=${encodeURIComponent(nextPath)}`}
        >
          {t('auth.signIn')}
        </Link>
      </AuthShell>
    );
  }

  return (
    <RegisterFromInvitation
      token={token}
      subtitle={subtitle}
      needsLicence={preview.role !== 'RECEPTIONIST'}
      email={preview.email ?? ''}
    />
  );
}

function AcceptWithSession({ token, subtitle }: { token: string; subtitle: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [accept, { loading, error }] = useMutation(ACCEPT_CLINIC_INVITATION_MUTATION, {
    refetchQueries: [{ query: MY_CLINICS_QUERY }],
    awaitRefetchQueries: true,
  });

  const handleAccept = async () => {
    try {
      await accept({ variables: { token } });
      void navigate('/clinics', { replace: true });
    } catch {
      // Error state is shown below.
    }
  };

  return (
    <AuthShell title={t('invite.title')} subtitle={subtitle}>
      {error ? (
        <p className="auth-alert" role="alert">
          {getAuthErrorMessage(error, 'save-clinic')}
        </p>
      ) : null}
      <button
        type="button"
        className="auth-submit"
        onClick={() => void handleAccept()}
        disabled={loading}
      >
        {loading ? t('invite.accepting') : t('invite.accept')}
      </button>
    </AuthShell>
  );
}

type RegisterFromInvitationProps = {
  token: string;
  subtitle: string;
  needsLicence: boolean;
  email: string;
};

function RegisterFromInvitation({
  token,
  subtitle,
  needsLicence,
  email,
}: RegisterFromInvitationProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useApolloClient();
  const { registerWithInvitation } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = 'validation.firstNameRequired';
    if (!lastName.trim()) errors.lastName = 'validation.lastNameRequired';
    if (!password) errors.password = 'validation.passwordRequired';
    else if (password.length < 8) errors.password = 'validation.passwordMin';
    if (needsLicence && !licenseNumber.trim()) {
      errors.licenseNumber = 'validation.licenseNumberRequired';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await registerWithInvitation({
        token,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(needsLicence ? { licenseNumber: licenseNumber.trim() } : {}),
      });
      await client.refetchQueries({ include: [MY_CLINICS_QUERY] });
      void navigate('/', { replace: true });
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'auth'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title={t('invite.title')} subtitle={subtitle}>
      <form className="auth-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        {formError ? (
          <p className="auth-alert" role="alert">
            {formError}
          </p>
        ) : null}
        <p className="auth-card__subtitle">{t('invite.createAccount', { email })}</p>
        <div className="auth-form__row">
          <AuthFormField
            id="invite-first-name"
            label={t('auth.firstName')}
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            error={fieldErrors.firstName}
            disabled={isSubmitting}
          />
          <AuthFormField
            id="invite-last-name"
            label={t('auth.lastName')}
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            error={fieldErrors.lastName}
            disabled={isSubmitting}
          />
        </div>
        <AuthFormField
          id="invite-password"
          type="password"
          label={t('auth.password')}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          disabled={isSubmitting}
        />
        {needsLicence ? (
          <AuthFormField
            id="invite-licence"
            label={t('auth.licenseNumber')}
            autoComplete="off"
            value={licenseNumber}
            onChange={(event) => setLicenseNumber(event.target.value)}
            error={fieldErrors.licenseNumber}
            disabled={isSubmitting}
          />
        ) : null}
        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('auth.signingUp') : t('invite.createAndJoin')}
        </button>
        {needsLicence ? (
          <p className="auth-card__subtitle">{t('invite.licenceNote')}</p>
        ) : null}
      </form>
    </AuthShell>
  );
}
