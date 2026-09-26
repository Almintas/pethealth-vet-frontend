import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import type { Patient } from '../../patients/types';
import { PROFILE_MEDICATIONS_LIMIT } from '../constants/medications-limits';
import { PATIENT_MEDICATIONS_PAGE_QUERY } from '../graphql';
import type { PatientMedicationsPageQueryResult, VetMedication } from '../types';
import { MedicationDetailDialog } from './MedicationDetailDialog';
import { MedicationFormDialog } from './MedicationFormDialog';
import { MedicationListItem } from './MedicationListItem';
import '../../medical-records/components/medical-history.css';

type MedicationsSectionProps = {
  patient: Patient;
  clinics: { id: string; name: string }[];
};

export function MedicationsSection({ patient, clinics }: MedicationsSectionProps) {
  const { t } = useTranslation();
  const [selectedMedication, setSelectedMedication] = useState<VetMedication | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editMedication, setEditMedication] = useState<VetMedication | null>(null);

  const { data, loading, error, refetch } = useQuery<PatientMedicationsPageQueryResult>(
    PATIENT_MEDICATIONS_PAGE_QUERY,
    {
      variables: {
        patientId: patient.id,
        query: { page: 1, limit: PROFILE_MEDICATIONS_LIMIT },
      },
      fetchPolicy: 'cache-and-network',
    },
  );

  const pageResult = data?.patientMedicationsPage;
  const total = pageResult?.total ?? 0;
  const activeTotal = pageResult?.activeTotal ?? 0;
  const medications = pageResult?.items ?? [];

  const isInitialLoading = loading && !pageResult;
  const medicationsPath = `/patients/${patient.id}/medications`;

  const showNoActiveEmpty = !isInitialLoading && !error && activeTotal === 0;

  return (
    <section className="patient-profile__block" aria-labelledby="medications-heading">
      <div className="medical-history__header">
        <h2 id="medications-heading" className="medical-history__title">
          {t('medications.medications')}
        </h2>
        {total > 0 ? (
          <Link className="medical-history__view-all-link" to={medicationsPath}>
            {t('medications.viewAll')}
          </Link>
        ) : null}
      </div>

      {isInitialLoading ? (
        <LoadingState message={t('medications.loading')} skeleton skeletonLines={3} />
      ) : null}

      {error ? (
        <ErrorAlert
          title={t('medications.loadErrorTitle')}
          message={t('medications.loadErrorDescription')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {showNoActiveEmpty ? (
        <div className="medical-history__empty">
          <p className="medical-history__empty-title">{t('medications.noActiveTitle')}</p>
          <p>{t('medications.noActiveDescription')}</p>
        </div>
      ) : null}

      {!error && medications.length > 0 ? (
        <div className="medical-history__list">
          {medications.map((medication) => (
            <MedicationListItem
              key={medication.id}
              medication={medication}
              onView={setSelectedMedication}
            />
          ))}
        </div>
      ) : null}

      {total > PROFILE_MEDICATIONS_LIMIT ? (
        <Link className="medical-history__view-all-count" to={medicationsPath}>
          {t('medications.viewAllCount', { count: total })}
        </Link>
      ) : null}

      <div className="medical-history__actions">
        <button
          type="button"
          className="ph-button ph-button--primary"
          onClick={() => setIsAddOpen(true)}
        >
          {t('medications.addMedicationAction')}
        </button>
      </div>

      {isAddOpen ? (
        <MedicationFormDialog
          mode="add"
          open
          onClose={() => setIsAddOpen(false)}
          patient={patient}
          clinics={clinics}
          onSuccess={() => void refetch()}
        />
      ) : null}

      {editMedication ? (
        <MedicationFormDialog
          mode="edit"
          open
          onClose={() => setEditMedication(null)}
          patient={patient}
          clinics={clinics}
          medication={editMedication}
          onSuccess={() => {
            setEditMedication(null);
            setSelectedMedication(null);
            void refetch();
          }}
        />
      ) : null}

      <MedicationDetailDialog
        medication={selectedMedication}
        patient={patient}
        onClose={() => setSelectedMedication(null)}
        onEdit={(med) => {
          setSelectedMedication(null);
          setEditMedication(med);
        }}
      />
    </section>
  );
}
