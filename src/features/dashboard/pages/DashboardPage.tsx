import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { useAuth, getVeterinarianFirstName } from '../../auth';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import { ClinicCard } from '../../clinics/components/ClinicCard';
import { ClinicDialog, type ClinicFormValues } from '../../clinics/components/ClinicDialog';
import { MY_CLINICS_QUERY } from '../../clinics/graphql';
import { useCreateClinic } from '../../clinics/hooks/useCreateClinic';
import type { MyClinicsQueryResult } from '../../clinics/types';
import '../../clinics/components/clinic-card.css';
import '../../clinics/components/clinic-dialog.css';

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogInstance, setDialogInstance] = useState(0);

  const openCreateDialog = () => {
    setDialogInstance((value) => value + 1);
    setIsDialogOpen(true);
  };
  const { createClinic, loading: isCreating } = useCreateClinic();
  const { data, loading, error, refetch } = useQuery<MyClinicsQueryResult>(
    MY_CLINICS_QUERY,
    { fetchPolicy: 'cache-and-network' },
  );

  const firstName = getVeterinarianFirstName(user);
  const clinics = data?.myClinics ?? [];

  const handleCreate = async (values: ClinicFormValues) => {
    await createClinic(values);
    setIsDialogOpen(false);
  };

  return (
    <div className="ph-page">
      <header className="ph-page-header">
        <div>
          <p className="ph-page-header__eyebrow">{t('dashboard.eyebrow')}</p>
          <h1 className="ph-page-header__title">
            {t('dashboard.welcome', {
              name: firstName || t('common.account'),
            })}
          </h1>
          <p className="ph-page-header__subtitle">{t('dashboard.subtitle')}</p>
        </div>
      </header>

      <section aria-labelledby="dashboard-clinics-title">
        <div className="ph-section-header">
          <h2 id="dashboard-clinics-title" className="ph-section-title">
            {t('dashboard.yourClinics')}
          </h2>
          <Link className="ph-link-button" to="/clinics">
            {t('dashboard.viewAllClinics')}
          </Link>
        </div>

        {loading && clinics.length === 0 ? (
          <LoadingState message={t('clinics.loading')} skeleton skeletonLines={3} />
        ) : null}

        {error ? (
          <ErrorAlert
            message={getAuthErrorMessage(error, 'load-clinics')}
            onRetry={() => void refetch()}
          />
        ) : null}

        {!loading && !error && clinics.length === 0 ? (
          <div className="ph-empty-state">
            <p>{t('dashboard.noClinics')}</p>
            <button
              type="button"
              className="ph-button ph-button--primary"
              onClick={openCreateDialog}
            >
              {t('clinics.createClinic')}
            </button>
          </div>
        ) : null}

        {clinics.length > 0 ? (
          <div className="clinic-grid">
            {clinics.slice(0, 3).map((membership) => (
              <ClinicCard key={membership.id} membership={membership} />
            ))}
          </div>
        ) : null}
      </section>

      <ClinicDialog
        key={dialogInstance}
        isOpen={isDialogOpen}
        title={t('clinics.createClinic')}
        isSubmitting={isCreating}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
