import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { useAuth } from '../../auth';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import { CreateClinicDialog } from '../components/CreateClinicDialog';
import { MyClinicInfoCard } from '../components/MyClinicInfoCard';
import { MY_CLINICS_QUERY } from '../graphql';
import { CLINIC_CREATOR_ROLES, type MyClinicsQueryResult } from '../types';
import '../components/my-clinic-card.css';

export function ClinicsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const canCreateClinic = CLINIC_CREATOR_ROLES.some((role) => role === user?.role);
  const { data, loading, error, refetch } = useQuery<MyClinicsQueryResult>(
    MY_CLINICS_QUERY,
    { fetchPolicy: 'cache-and-network' },
  );

  const clinics = data?.myClinics ?? [];
  const isInitialLoading = loading && clinics.length === 0;
  const showEmptyState = !isInitialLoading && !error && clinics.length === 0;
  const singleClinic = clinics.length === 1 ? clinics[0] : null;

  return (
    <div className="ph-page">
      <header className="ph-page-header">
        <div>
          <p className="ph-page-header__eyebrow">{t('clinics.eyebrow')}</p>
          <h1 className="ph-page-header__title">
            {singleClinic ? singleClinic.name : t('clinics.pageTitle')}
          </h1>
          <p className="ph-page-header__subtitle">{t('clinics.workspaceDescription')}</p>
        </div>
        {canCreateClinic && clinics.length > 0 ? (
          <button
            type="button"
            className="ph-button ph-button--secondary"
            onClick={() => setIsCreateOpen(true)}
          >
            {t('clinics.create.anotherAction')}
          </button>
        ) : null}
      </header>

      {isInitialLoading ? (
        <LoadingState message={t('clinics.loading')} skeleton skeletonLines={4} />
      ) : null}

      {error ? (
        <ErrorAlert
          message={getAuthErrorMessage(error, 'load-clinics')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {showEmptyState ? (
        canCreateClinic ? (
          <EmptyState
            title={t('clinics.create.emptyTitle')}
            description={t('clinics.create.emptyDescription')}
            actionLabel={t('clinics.create.action')}
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <EmptyState
            title={t('clinics.unassignedTitle')}
            description={t('clinics.unassignedDescription')}
          />
        )
      ) : null}

      {clinics.length === 1 && singleClinic ? (
        <MyClinicInfoCard clinic={singleClinic} user={user} />
      ) : null}

      {clinics.length > 1 ? (
        <div className="my-clinic-list">
          {clinics.map((clinic) => (
            <section key={clinic.id}>
              <h2 className="my-clinic-list__item-title">{clinic.name}</h2>
              <MyClinicInfoCard clinic={clinic} user={user} />
            </section>
          ))}
        </div>
      ) : null}

      <CreateClinicDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
