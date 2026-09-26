import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import { ClinicCard } from '../components/ClinicCard';
import { ClinicDialog, type ClinicFormValues } from '../components/ClinicDialog';
import { MY_CLINICS_QUERY } from '../graphql';
import { useCreateClinic } from '../hooks/useCreateClinic';
import type { MyClinicsQueryResult } from '../types';
import '../components/clinic-card.css';
import '../components/clinic-dialog.css';

export function ClinicsPage() {
  const { t } = useTranslation();
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

  const clinics = data?.myClinics ?? [];

  const handleCreate = async (values: ClinicFormValues) => {
    await createClinic(values);
    setIsDialogOpen(false);
  };

  return (
    <div className="ph-page">
      <header className="ph-page-header">
        <div>
          <p className="ph-page-header__eyebrow">{t('navigation.clinics')}</p>
          <h1 className="ph-page-header__title">{t('clinics.title')}</h1>
          <p className="ph-page-header__subtitle">{t('clinics.subtitle')}</p>
        </div>
        <button
          type="button"
          className="ph-button ph-button--primary"
          onClick={openCreateDialog}
        >
          {t('clinics.createClinic')}
        </button>
      </header>

      {loading && clinics.length === 0 ? (
        <LoadingState message={t('clinics.loading')} skeleton skeletonLines={4} />
      ) : null}

      {error ? (
        <ErrorAlert
          message={getAuthErrorMessage(error, 'load-clinics')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!loading && !error && clinics.length === 0 ? (
        <div className="ph-empty-state">
          <p>{t('clinics.empty')}</p>
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
          {clinics.map((membership) => (
            <ClinicCard key={membership.id} membership={membership} />
          ))}
        </div>
      ) : null}

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
