import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../useAuth';

export function PendingApprovalPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isRejected = user?.approvalStatus === 'REJECTED';

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <AuthShell
      title={t(isRejected ? 'auth.rejectedTitle' : 'auth.pendingTitle')}
      subtitle={t(isRejected ? 'auth.rejectedText' : 'auth.pendingText')}
    >
      <dl className="auth-pending__details">
        <div>
          <dt>{t('auth.accountLabel')}</dt>
          <dd>{user?.email}</dd>
        </div>
        {user?.veterinarianProfile?.licenseNumber ? (
          <div>
            <dt>{t('auth.licenseLabel')}</dt>
            <dd>{user.veterinarianProfile.licenseNumber}</dd>
          </div>
        ) : null}
      </dl>
      <div className="auth-form">
        {!isRejected ? (
          <button
            className="auth-submit"
            type="button"
            onClick={() => window.location.reload()}
          >
            {t('auth.checkAgain')}
          </button>
        ) : null}
        <button
          className="auth-switch__button"
          type="button"
          onClick={() => void handleSignOut()}
          disabled={isSigningOut}
        >
          {t('auth.signOut')}
        </button>
      </div>
    </AuthShell>
  );
}
