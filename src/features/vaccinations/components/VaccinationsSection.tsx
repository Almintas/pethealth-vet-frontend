import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import type { Patient } from '../../patients/types';
import { PROFILE_VACCINATIONS_LIMIT } from '../constants/vaccinations-limits';
import { PATIENT_VACCINATIONS_PAGE_QUERY } from '../graphql';
import type { PatientVaccinationsPageQueryResult, VetVaccination } from '../types';
import { VaccinationDetailDialog } from './VaccinationDetailDialog';
import { VaccinationFormDialog } from './VaccinationFormDialog';
import { VaccinationListItem } from './VaccinationListItem';
import '../../medical-records/components/medical-history.css';

type VaccinationsSectionProps = {
  patient: Patient;
  clinics: { id: string; name: string }[];
};

export function VaccinationsSection({ patient, clinics }: VaccinationsSectionProps) {
  const { t } = useTranslation();
  const [selectedVaccination, setSelectedVaccination] = useState<VetVaccination | null>(
    null,
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editVaccination, setEditVaccination] = useState<VetVaccination | null>(null);

  const { data, loading, error, refetch } = useQuery<PatientVaccinationsPageQueryResult>(
    PATIENT_VACCINATIONS_PAGE_QUERY,
    {
      variables: {
        patientId: patient.id,
        query: { page: 1, limit: PROFILE_VACCINATIONS_LIMIT },
      },
      fetchPolicy: 'cache-and-network',
    },
  );

  const pageResult = data?.patientVaccinationsPage;
  const total = pageResult?.total ?? 0;
  const vaccinations = pageResult?.items ?? [];

  const isInitialLoading = loading && !pageResult;
  const vaccinationsPath = `/patients/${patient.id}/vaccinations`;

  return (
    <section className="patient-profile__block" aria-labelledby="vaccinations-heading">
      <div className="medical-history__header">
        <h2 id="vaccinations-heading" className="medical-history__title">
          {t('vaccinations.vaccinations')}
        </h2>
        {total > 0 ? (
          <Link className="medical-history__view-all-link" to={vaccinationsPath}>
            {t('vaccinations.viewAll')}
          </Link>
        ) : null}
      </div>

      {isInitialLoading ? (
        <LoadingState message={t('vaccinations.loading')} skeleton skeletonLines={3} />
      ) : null}

      {error ? (
        <ErrorAlert
          title={t('vaccinations.loadErrorTitle')}
          message={t('vaccinations.loadErrorDescription')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isInitialLoading && !error && total === 0 ? (
        <div className="medical-history__empty">
          <p className="medical-history__empty-title">{t('vaccinations.emptyTitle')}</p>
          <p>{t('vaccinations.emptyDescription')}</p>
        </div>
      ) : null}

      {!error && vaccinations.length > 0 ? (
        <div className="medical-history__list">
          {vaccinations.map((vaccination) => (
            <VaccinationListItem
              key={vaccination.id}
              vaccination={vaccination}
              onView={setSelectedVaccination}
            />
          ))}
        </div>
      ) : null}

      {total > PROFILE_VACCINATIONS_LIMIT ? (
        <Link className="medical-history__view-all-count" to={vaccinationsPath}>
          {t('vaccinations.viewAllCount', { count: total })}
        </Link>
      ) : null}

      <div className="medical-history__actions">
        <button
          type="button"
          className="ph-button ph-button--primary"
          onClick={() => setIsAddOpen(true)}
        >
          {t('vaccinations.addVaccinationAction')}
        </button>
      </div>

      {isAddOpen ? (
        <VaccinationFormDialog
          mode="add"
          open
          onClose={() => setIsAddOpen(false)}
          patient={patient}
          clinics={clinics}
          onSuccess={() => void refetch()}
        />
      ) : null}

      {editVaccination ? (
        <VaccinationFormDialog
          mode="edit"
          open
          onClose={() => setEditVaccination(null)}
          patient={patient}
          clinics={clinics}
          vaccination={editVaccination}
          onSuccess={() => {
            setEditVaccination(null);
            setSelectedVaccination(null);
            void refetch();
          }}
        />
      ) : null}

      <VaccinationDetailDialog
        vaccination={selectedVaccination}
        patient={patient}
        onClose={() => setSelectedVaccination(null)}
        onEdit={(record) => {
          setSelectedVaccination(null);
          setEditVaccination(record);
        }}
      />
    </section>
  );
}
