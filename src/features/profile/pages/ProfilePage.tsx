import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { useAuth } from '../../auth';
import { ME_QUERY } from '../../auth/graphql';
import type { AuthUser } from '../../auth/types';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import { TwoFactorCard } from '../components/TwoFactorCard';
import './profile-page.css';

type MeQueryResult = {
  me: AuthUser;
};

export function ProfilePage() {
  const { t } = useTranslation();
  const { user: sessionUser, isInitializing } = useAuth();
  const { data, loading, error, refetch } = useQuery<MeQueryResult>(ME_QUERY, {
    skip: isInitializing,
    fetchPolicy: 'cache-and-network',
  });

  const user = data?.me ?? sessionUser;
  const profile = user?.veterinarianProfile;

  if ((loading && !user) || isInitializing) {
    return (
      <div className="ph-page">
        <LoadingState message={t('profile.loading')} skeleton skeletonLines={4} />
      </div>
    );
  }

  return (
    <div className="ph-page">
      <header className="ph-page-header">
        <div>
          <p className="ph-page-header__eyebrow">{t('navigation.profile')}</p>
          <h1 className="ph-page-header__title">{t('profile.title')}</h1>
          <p className="ph-page-header__subtitle">{t('profile.subtitle')}</p>
        </div>
      </header>

      {error ? (
        <ErrorAlert
          message={getAuthErrorMessage(error, 'load-profile')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {user ? (
        <section className="ph-card ph-card--pad profile-card" aria-label={t('profile.title')}>
          <dl className="profile-card__grid">
            <div>
              <dt>{t('profile.firstName')}</dt>
              <dd>{profile?.firstName?.trim() || t('common.notProvided')}</dd>
            </div>
            <div>
              <dt>{t('profile.lastName')}</dt>
              <dd>{profile?.lastName?.trim() || t('common.notProvided')}</dd>
            </div>
            <div>
              <dt>{t('profile.email')}</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>{t('profile.licenseNumber')}</dt>
              <dd>{profile?.licenseNumber?.trim() || t('common.notProvided')}</dd>
            </div>
            <div>
              <dt>{t('profile.role')}</dt>
              <dd>{user.role}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {user ? <TwoFactorCard /> : null}
    </div>
  );
}
