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
import { useDebouncedValue } from '../../medical-records/utils/use-debounced-value';
import { MedicationDetailDialog } from '../components/MedicationDetailDialog';
import { MedicationFormDialog } from '../components/MedicationFormDialog';
import { MedicationListItem } from '../components/MedicationListItem';
import { MedicationsPagination } from '../components/MedicationsPagination';
import {
  MEDICATIONS_PAGE_SIZE,
  MEDICATIONS_SEARCH_DEBOUNCE_MS,
} from '../constants/medications-limits';
import { PATIENT_MEDICATIONS_PAGE_QUERY } from '../graphql';
import type { PatientMedicationsPageQueryResult, VetMedication } from '../types';
import {
  buildMedicationsSearchParams,
  parseMedicationsUrlState,
  toMedicationsPageQuery,
  type MedicationsUrlState,
} from '../utils/medications-url-state';
import '../../medical-records/components/medical-history.css';
import '../../medical-records/pages/patient-medical-history-page.css';

export function PatientMedicationsPage() {
  const { t } = useTranslation();
  const { id: patientId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = useMemo(
    () => parseMedicationsUrlState(searchParams),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(() => urlState.search);
  const debouncedSearch = useDebouncedValue(searchInput, MEDICATIONS_SEARCH_DEBOUNCE_MS);

  const [selectedMedication, setSelectedMedication] = useState<VetMedication | null>(null);
  const [editMedication, setEditMedication] = useState<VetMedication | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const updateUrlState = (patch: Partial<MedicationsUrlState>) => {
    const current = parseMedicationsUrlState(searchParams);
    const next: MedicationsUrlState = { ...current, ...patch };
    setSearchParams(buildMedicationsSearchParams(next));
  };

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    const current = parseMedicationsUrlState(searchParams);
    if (trimmed === current.search) {
      return;
    }
    setSearchParams(
      buildMedicationsSearchParams({ ...current, search: trimmed, page: 1 }),
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

  const graphqlQuery = useMemo(() => toMedicationsPageQuery(urlState), [urlState]);

  const { data, loading, error, refetch } = useQuery<PatientMedicationsPageQueryResult>(
    PATIENT_MEDICATIONS_PAGE_QUERY,
    {
      variables: { patientId: patientId ?? '', query: graphqlQuery },
      skip: !patientId,
      fetchPolicy: 'cache-and-network',
    },
  );

  const patient = patientData?.patient;
  const pageResult = data?.patientMedicationsPage;
  const medications = pageResult?.items ?? [];
  const total = pageResult?.total ?? 0;
  const page = pageResult?.page ?? 1;
  const totalPages = pageResult?.totalPages ?? 0;
  const limit = pageResult?.limit ?? MEDICATIONS_PAGE_SIZE;

  const hasActiveFilters = Boolean(urlState.search || urlState.status !== 'all');

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
        ← {t('medications.backToPatient', { name: patient?.name ?? t('medications.patient') })}
      </Link>

      {isInitialLoading ? (
        <LoadingState message={t('medications.loading')} skeleton skeletonLines={5} />
      ) : null}

      {patient ? (
        <header className="medical-history-page__header ph-card ph-card--pad">
          <p className="medical-history-page__eyebrow">{t('medications.medications')}</p>
          <h1 className="medical-history-page__title">{patient.name}</h1>
          <p className="medical-history-page__subtitle">{getSpeciesBreedLine(patient)}</p>
          <p className="medical-history-page__count">
            {t('medications.medicationCount', { count: total })}
          </p>
          <p className="medical-history-page__context">
            {t('medications.medicationsFor', { name: patient.name })}
          </p>
        </header>
      ) : null}

      <section className="medical-history-page__filters ph-card ph-card--pad">
        <label className="ph-field medical-history-page__search">
          <span className="ph-field__label">{t('medications.searchLabel')}</span>
          <input
            type="search"
            className="ph-field__input"
            value={searchInput}
            placeholder={t('medications.searchPlaceholder')}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>

        <div className="medical-history-page__filter-row">
          <label className="ph-field">
            <span className="ph-field__label">{t('medications.statusFilter')}</span>
            <select
              className="ph-field__select"
              value={urlState.status}
              onChange={(event) =>
                updateUrlState({
                  status: event.target.value as MedicationsUrlState['status'],
                  page: 1,
                })
              }
            >
              <option value="all">{t('medications.allStatuses')}</option>
              <option value="active">{t('medications.statusActive')}</option>
              <option value="stopped">{t('medications.statusStopped')}</option>
            </select>
          </label>
        </div>
      </section>

      {error ? (
        <ErrorAlert
          title={t('medications.fullPageLoadErrorTitle')}
          message={t('medications.fullPageLoadErrorDescription')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!error && !isInitialLoading && total === 0 && !hasActiveFilters ? (
        <div className="ph-card ph-card--pad medical-history-page__empty">
          <p className="medical-history__empty-title">{t('medications.fullPageEmptyTitle')}</p>
          <p>{t('medications.fullPageEmptyDescription')}</p>
          <button
            type="button"
            className="ph-button ph-button--primary"
            onClick={() => setIsAddOpen(true)}
          >
            {t('medications.addMedicationAction')}
          </button>
        </div>
      ) : null}

      {!error && !isInitialLoading && total === 0 && hasActiveFilters ? (
        <div className="ph-card ph-card--pad medical-history-page__empty">
          <p className="medical-history__empty-title">{t('medications.filteredEmptyTitle')}</p>
          <p>{t('medications.filteredEmptyDescription')}</p>
        </div>
      ) : null}

      {!error && medications.length > 0 ? (
        <section className="medical-history-page__list">
          <div className="medical-history__list">
            {medications.map((medication) => (
              <MedicationListItem
                key={medication.id}
                medication={medication}
                onView={setSelectedMedication}
              />
            ))}
          </div>
          <MedicationsPagination
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
          {t('medications.addMedicationAction')}
        </button>
      </div>

      {patient && isAddOpen ? (
        <MedicationFormDialog
          mode="add"
          open
          onClose={() => setIsAddOpen(false)}
          patient={patient}
          clinics={clinics}
          onSuccess={() => void refetch()}
        />
      ) : null}

      {patient && editMedication ? (
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

      {patient ? (
        <MedicationDetailDialog
          medication={selectedMedication}
          patient={patient}
          onClose={() => setSelectedMedication(null)}
          onEdit={(med) => {
            setSelectedMedication(null);
            setEditMedication(med);
          }}
        />
      ) : null}
    </div>
  );
}
