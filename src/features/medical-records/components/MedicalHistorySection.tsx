import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import type { Patient } from '../../patients/types';
import { PROFILE_MEDICAL_RECORDS_LIMIT } from '../constants/medical-history-limits';
import { PATIENT_MEDICAL_RECORDS_PAGE_QUERY } from '../graphql';
import type { PatientMedicalRecordsPageQueryResult, VetMedicalRecord } from '../types';
import { MedicalRecordDetailDialog } from './MedicalRecordDetailDialog';
import { MedicalRecordFormDialog } from './MedicalRecordFormDialog';
import { MedicalRecordListItem } from './MedicalRecordListItem';
import './medical-history.css';

type MedicalHistorySectionProps = {
  patient: Patient;
  clinics: { id: string; name: string }[];
};

export function MedicalHistorySection({
  patient,
  clinics,
}: MedicalHistorySectionProps) {
  const { t } = useTranslation();
  const [selectedRecord, setSelectedRecord] = useState<VetMedicalRecord | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<VetMedicalRecord | null>(null);

  const { data, loading, error, refetch } = useQuery<PatientMedicalRecordsPageQueryResult>(
    PATIENT_MEDICAL_RECORDS_PAGE_QUERY,
    {
      variables: {
        patientId: patient.id,
        query: { page: 1, limit: PROFILE_MEDICAL_RECORDS_LIMIT },
      },
      fetchPolicy: 'cache-and-network',
    },
  );

  const pageResult = data?.patientMedicalRecordsPage;
  const total = pageResult?.total ?? 0;

  const records = pageResult?.items ?? [];

  const isInitialLoading = loading && !pageResult;
  const historyPath = `/patients/${patient.id}/medical-history`;

  return (
    <section className="patient-profile__block" aria-labelledby="medical-history-heading">
        <div className="medical-history__header">
          <h2 id="medical-history-heading" className="medical-history__title">
            {t('medicalRecords.medicalHistory')}
          </h2>
          {total > 0 ? (
            <Link className="medical-history__view-all-link" to={historyPath}>
              {t('medicalRecords.viewAll')}
            </Link>
          ) : null}
        </div>

        {isInitialLoading ? (
          <LoadingState message={t('medicalRecords.loading')} skeleton skeletonLines={3} />
        ) : null}

        {error ? (
          <ErrorAlert
            title={t('medicalRecords.loadErrorTitle')}
            message={t('medicalRecords.loadErrorDescription')}
            onRetry={() => void refetch()}
          />
        ) : null}

        {!isInitialLoading && !error && total === 0 ? (
          <div className="medical-history__empty">
            <p className="medical-history__empty-title">{t('medicalRecords.emptyTitle')}</p>
            <p>{t('medicalRecords.emptyDescription')}</p>
          </div>
        ) : null}

        {!error && records.length > 0 ? (
          <div className="medical-history__list">
            {records.map((record) => (
              <MedicalRecordListItem
                key={record.id}
                record={record}
                onView={setSelectedRecord}
              />
            ))}
          </div>
        ) : null}

        {total > PROFILE_MEDICAL_RECORDS_LIMIT ? (
          <Link className="medical-history__view-all-count" to={historyPath}>
            {t('medicalRecords.viewAllCount', { count: total })}
          </Link>
        ) : null}

        <div className="medical-history__actions">
          <button
            type="button"
            className="ph-button ph-button--primary"
            onClick={() => setIsAddOpen(true)}
          >
            {t('medicalRecords.addMedicalRecordAction')}
          </button>
        </div>

        {isAddOpen ? (
          <MedicalRecordFormDialog
            mode="add"
            open
            onClose={() => setIsAddOpen(false)}
            patient={patient}
            clinics={clinics}
            onSuccess={() => void refetch()}
          />
        ) : null}

        {editRecord ? (
          <MedicalRecordFormDialog
            mode="edit"
            open
            onClose={() => setEditRecord(null)}
            patient={patient}
            clinics={clinics}
            record={editRecord}
            onSuccess={() => {
              setEditRecord(null);
              setSelectedRecord(null);
              void refetch();
            }}
          />
        ) : null}

        <MedicalRecordDetailDialog
          record={selectedRecord}
          patient={patient}
          onClose={() => setSelectedRecord(null)}
          onEdit={(record) => {
            setSelectedRecord(null);
            setEditRecord(record);
          }}
        />
    </section>
  );
}
