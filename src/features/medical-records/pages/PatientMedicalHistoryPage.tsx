import { useQuery } from '@apollo/client/react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { MY_CLINICS_QUERY } from '../../clinics/graphql';
import type { MyClinicsQueryResult } from '../../clinics/types';
import { PATIENT_QUERY } from '../../patients/graphql';
import type { PatientQueryResult } from '../../patients/types';
import { getSpeciesBreedLine } from '../../patients/utils/patient-display';
import { MedicalHistoryPagination } from '../components/MedicalHistoryPagination';
import { MedicalRecordDetailDialog } from '../components/MedicalRecordDetailDialog';
import { MedicalRecordFormDialog } from '../components/MedicalRecordFormDialog';
import { MedicalRecordListItem } from '../components/MedicalRecordListItem';
import {
  MEDICAL_HISTORY_PAGE_SIZE,
  MEDICAL_HISTORY_SEARCH_DEBOUNCE_MS,
} from '../constants/medical-history-limits';
import { MEDICAL_RECORD_TYPE_OPTIONS } from '../constants/medical-record-types';
import { PATIENT_MEDICAL_RECORDS_PAGE_QUERY } from '../graphql';
import type {
  PatientMedicalRecordsPageQueryResult,
  VetMedicalRecord,
} from '../types';
import {
  buildMedicalHistorySearchParams,
  parseMedicalHistoryUrlState,
  toMedicalRecordsPageQuery,
  type MedicalHistoryUrlState,
} from '../utils/medical-history-url-state';
import { useDebouncedValue } from '../utils/use-debounced-value';
import '../components/medical-history.css';
import './patient-medical-history-page.css';

export function PatientMedicalHistoryPage() {
  const { t } = useTranslation();
  const { id: patientId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = useMemo(
    () => parseMedicalHistoryUrlState(searchParams),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(() => urlState.search);
  const debouncedSearch = useDebouncedValue(
    searchInput,
    MEDICAL_HISTORY_SEARCH_DEBOUNCE_MS,
  );

  const [selectedRecord, setSelectedRecord] = useState<VetMedicalRecord | null>(null);
  const [editRecord, setEditRecord] = useState<VetMedicalRecord | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const updateUrlState = (patch: Partial<MedicalHistoryUrlState>) => {
    const current = parseMedicalHistoryUrlState(searchParams);
    const next: MedicalHistoryUrlState = {
      ...current,
      ...patch,
    };
    setSearchParams(buildMedicalHistorySearchParams(next));
  };

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    const current = parseMedicalHistoryUrlState(searchParams);
    if (trimmed === current.search) {
      return;
    }
    setSearchParams(
      buildMedicalHistorySearchParams({ ...current, search: trimmed, page: 1 }),
    );
  }, [debouncedSearch, searchParams, setSearchParams]);

  const { data: patientData, loading: patientLoading } = useQuery<PatientQueryResult>(
    PATIENT_QUERY,
    {
      variables: { id: patientId ?? '' },
      skip: !patientId,
    },
  );

  const { data: clinicsData } = useQuery<MyClinicsQueryResult>(MY_CLINICS_QUERY);

  const graphqlQuery = useMemo(
    () => toMedicalRecordsPageQuery(urlState),
    [urlState],
  );

  const { data, loading, error, refetch } = useQuery<PatientMedicalRecordsPageQueryResult>(
    PATIENT_MEDICAL_RECORDS_PAGE_QUERY,
    {
      variables: { patientId: patientId ?? '', query: graphqlQuery },
      skip: !patientId,
      fetchPolicy: 'cache-and-network',
    },
  );

  const patient = patientData?.patient;
  const pageResult = data?.patientMedicalRecordsPage;
  const records = pageResult?.items ?? [];
  const total = pageResult?.total ?? 0;
  const page = pageResult?.page ?? 1;
  const totalPages = pageResult?.totalPages ?? 0;
  const limit = pageResult?.limit ?? MEDICAL_HISTORY_PAGE_SIZE;

  const hasActiveFilters = Boolean(
    urlState.search || urlState.type || urlState.dateFrom || urlState.dateTo,
  );

  const clinics =
    clinicsData?.myClinics?.map((clinic) => ({
      id: clinic.id,
      name: clinic.name,
    })) ?? [];

  if (!patientId) {
    return null;
  }

  const isInitialLoading = (loading && !pageResult) || (patientLoading && !patient);

  return (
    <div className="ph-page medical-history-page">
      <Link className="patient-profile__back" to={`/patients/${patientId}`}>
        ← {t('medicalRecords.backToPatient', { name: patient?.name ?? t('medicalRecords.patient') })}
      </Link>

      {isInitialLoading ? (
        <LoadingState message={t('medicalRecords.loading')} skeleton skeletonLines={5} />
      ) : null}

      {patient ? (
        <header className="medical-history-page__header ph-card ph-card--pad">
          <p className="medical-history-page__eyebrow">{t('medicalRecords.medicalHistory')}</p>
          <h1 className="medical-history-page__title">{patient.name}</h1>
          <p className="medical-history-page__subtitle">{getSpeciesBreedLine(patient)}</p>
          <p className="medical-history-page__count">
            {t('medicalRecords.recordCount', { count: total })}
          </p>
          <p className="medical-history-page__context">
            {t('medicalRecords.medicalHistoryFor', { name: patient.name })}
          </p>
        </header>
      ) : null}

      <section className="medical-history-page__filters ph-card ph-card--pad">
        <label className="ph-field medical-history-page__search">
          <span className="ph-field__label">{t('medicalRecords.searchLabel')}</span>
          <input
            type="search"
            className="ph-field__input"
            value={searchInput}
            placeholder={t('medicalRecords.searchPlaceholder')}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>

        <div className="medical-history-page__filter-row">
          <label className="ph-field">
            <span className="ph-field__label">{t('medicalRecords.recordType')}</span>
            <select
              className="ph-field__select"
              value={urlState.type}
              onChange={(event) =>
                updateUrlState({ type: event.target.value, page: 1 })
              }
            >
              <option value="">{t('medicalRecords.allTypes')}</option>
              {MEDICAL_RECORD_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`enums.medicalRecordType.${option.value}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="ph-field">
            <span className="ph-field__label">{t('medicalRecords.dateFrom')}</span>
            <input
              type="date"
              className="ph-field__input"
              value={urlState.dateFrom}
              onChange={(event) =>
                updateUrlState({ dateFrom: event.target.value, page: 1 })
              }
            />
          </label>

          <label className="ph-field">
            <span className="ph-field__label">{t('medicalRecords.dateTo')}</span>
            <input
              type="date"
              className="ph-field__input"
              value={urlState.dateTo}
              onChange={(event) =>
                updateUrlState({ dateTo: event.target.value, page: 1 })
              }
            />
          </label>
        </div>
      </section>

      {error ? (
        <ErrorAlert
          title={t('medicalRecords.fullPageLoadErrorTitle')}
          message={t('medicalRecords.fullPageLoadErrorDescription')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!error && !isInitialLoading && total === 0 && !hasActiveFilters ? (
        <div className="ph-card ph-card--pad medical-history-page__empty">
          <p className="medical-history__empty-title">{t('medicalRecords.fullPageEmptyTitle')}</p>
          <p>{t('medicalRecords.fullPageEmptyDescription')}</p>
          <button
            type="button"
            className="ph-button ph-button--primary"
            onClick={() => setIsAddOpen(true)}
          >
            {t('medicalRecords.addMedicalRecordAction')}
          </button>
        </div>
      ) : null}

      {!error && !isInitialLoading && total === 0 && hasActiveFilters ? (
        <div className="ph-card ph-card--pad medical-history-page__empty">
          <p className="medical-history__empty-title">{t('medicalRecords.filteredEmptyTitle')}</p>
          <p>{t('medicalRecords.filteredEmptyDescription')}</p>
        </div>
      ) : null}

      {!error && records.length > 0 ? (
        <section className="medical-history-page__list">
          <div className="medical-history__list">
            {records.map((record) => (
              <MedicalRecordListItem
                key={record.id}
                record={record}
                onView={setSelectedRecord}
              />
            ))}
          </div>
          <MedicalHistoryPagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={(nextPage) => updateUrlState({ page: nextPage })}
          />
        </section>
      ) : null}

      <div className="medical-history-page__add">
        <button
          type="button"
          className="ph-button ph-button--primary"
          onClick={() => setIsAddOpen(true)}
        >
          {t('medicalRecords.addMedicalRecordAction')}
        </button>
      </div>

      {patient && isAddOpen ? (
        <MedicalRecordFormDialog
          mode="add"
          open
          onClose={() => setIsAddOpen(false)}
          patient={patient}
          clinics={clinics}
          onSuccess={() => void refetch()}
        />
      ) : null}

      {patient && editRecord ? (
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

      {patient ? (
        <MedicalRecordDetailDialog
          record={selectedRecord}
          patient={patient}
          onClose={() => setSelectedRecord(null)}
          onEdit={(record) => {
            setSelectedRecord(null);
            setEditRecord(record);
          }}
        />
      ) : null}
    </div>
  );
}
