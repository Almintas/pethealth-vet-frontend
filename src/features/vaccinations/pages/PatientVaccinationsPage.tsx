import { useQuery } from '@apollo/client/react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { MY_CLINICS_QUERY } from '../../clinics/graphql';
import type { MyClinicsQueryResult } from '../../clinics/types';
import { useDebouncedValue } from '../../medical-records/utils/use-debounced-value';
import { PATIENT_QUERY } from '../../patients/graphql';
import type { PatientQueryResult } from '../../patients/types';
import { getSpeciesBreedLine } from '../../patients/utils/patient-display';
import { VaccinationDetailDialog } from '../components/VaccinationDetailDialog';
import { VaccinationFormDialog } from '../components/VaccinationFormDialog';
import { VaccinationListItem } from '../components/VaccinationListItem';
import { VaccinationsPagination } from '../components/VaccinationsPagination';
import {
  VACCINATIONS_PAGE_SIZE,
  VACCINATIONS_SEARCH_DEBOUNCE_MS,
} from '../constants/vaccinations-limits';
import { PATIENT_VACCINATIONS_PAGE_QUERY } from '../graphql';
import type { PatientVaccinationsPageQueryResult, VetVaccination } from '../types';
import {
  buildVaccinationsSearchParams,
  parseVaccinationsUrlState,
  toVaccinationsPageQuery,
  type VaccinationsUrlState,
} from '../utils/vaccinations-url-state';
import '../../medical-records/components/medical-history.css';
import '../../medical-records/pages/patient-medical-history-page.css';

export function PatientVaccinationsPage() {
  const { t } = useTranslation();
  const { id: patientId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = useMemo(
    () => parseVaccinationsUrlState(searchParams),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(() => urlState.search);
  const debouncedSearch = useDebouncedValue(searchInput, VACCINATIONS_SEARCH_DEBOUNCE_MS);

  const [selectedVaccination, setSelectedVaccination] = useState<VetVaccination | null>(
    null,
  );
  const [editVaccination, setEditVaccination] = useState<VetVaccination | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const updateUrlState = (patch: Partial<VaccinationsUrlState>) => {
    const current = parseVaccinationsUrlState(searchParams);
    const next: VaccinationsUrlState = { ...current, ...patch };
    setSearchParams(buildVaccinationsSearchParams(next));
  };

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    const current = parseVaccinationsUrlState(searchParams);
    if (trimmed === current.search) {
      return;
    }
    setSearchParams(
      buildVaccinationsSearchParams({ ...current, search: trimmed, page: 1 }),
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

  const graphqlQuery = useMemo(() => toVaccinationsPageQuery(urlState), [urlState]);

  const { data, loading, error, refetch } = useQuery<PatientVaccinationsPageQueryResult>(
    PATIENT_VACCINATIONS_PAGE_QUERY,
    {
      variables: { patientId: patientId ?? '', query: graphqlQuery },
      skip: !patientId,
      fetchPolicy: 'cache-and-network',
    },
  );

  const patient = patientData?.patient;
  const pageResult = data?.patientVaccinationsPage;
  const vaccinations = pageResult?.items ?? [];
  const total = pageResult?.total ?? 0;
  const page = pageResult?.page ?? 1;
  const totalPages = pageResult?.totalPages ?? 0;
  const limit = pageResult?.limit ?? VACCINATIONS_PAGE_SIZE;

  const hasActiveFilters = Boolean(
    urlState.search ||
      urlState.filter !== 'all' ||
      urlState.administeredFrom ||
      urlState.administeredTo,
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
        ← {t('vaccinations.backToPatient', { name: patient?.name ?? t('vaccinations.patient') })}
      </Link>

      {isInitialLoading ? (
        <LoadingState message={t('vaccinations.loading')} skeleton skeletonLines={5} />
      ) : null}

      {patient ? (
        <header className="medical-history-page__header ph-card ph-card--pad">
          <p className="medical-history-page__eyebrow">{t('vaccinations.vaccinations')}</p>
          <h1 className="medical-history-page__title">{patient.name}</h1>
          <p className="medical-history-page__subtitle">{getSpeciesBreedLine(patient, t)}</p>
          <p className="medical-history-page__count">
            {t('vaccinations.vaccinationCount', { count: total })}
          </p>
          <p className="medical-history-page__context">
            {t('vaccinations.vaccinationsFor', { name: patient.name })}
          </p>
        </header>
      ) : null}

      <section className="medical-history-page__filters ph-card ph-card--pad">
        <label className="ph-field medical-history-page__search">
          <span className="ph-field__label">{t('vaccinations.searchLabel')}</span>
          <input
            type="search"
            className="ph-field__input"
            value={searchInput}
            placeholder={t('vaccinations.searchPlaceholder')}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>

        <div className="medical-history-page__filter-row">
          <label className="ph-field">
            <span className="ph-field__label">{t('vaccinations.statusFilter')}</span>
            <select
              className="ph-field__select"
              value={urlState.filter}
              onChange={(event) =>
                updateUrlState({
                  filter: event.target.value as VaccinationsUrlState['filter'],
                  page: 1,
                })
              }
            >
              <option value="all">{t('vaccinations.allRecords')}</option>
              <option value="upcoming">{t('vaccinations.upcomingDue')}</option>
            </select>
          </label>

          <label className="ph-field">
            <span className="ph-field__label">{t('vaccinations.administeredFrom')}</span>
            <input
              type="date"
              className="ph-field__input"
              value={urlState.administeredFrom}
              onChange={(event) =>
                updateUrlState({ administeredFrom: event.target.value, page: 1 })
              }
            />
          </label>

          <label className="ph-field">
            <span className="ph-field__label">{t('vaccinations.administeredTo')}</span>
            <input
              type="date"
              className="ph-field__input"
              value={urlState.administeredTo}
              onChange={(event) =>
                updateUrlState({ administeredTo: event.target.value, page: 1 })
              }
            />
          </label>
        </div>
      </section>

      {error ? (
        <ErrorAlert
          title={t('vaccinations.fullPageLoadErrorTitle')}
          message={t('vaccinations.fullPageLoadErrorDescription')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!error && !isInitialLoading && total === 0 && !hasActiveFilters ? (
        <div className="ph-card ph-card--pad medical-history-page__empty">
          <p className="medical-history__empty-title">{t('vaccinations.fullPageEmptyTitle')}</p>
          <p>{t('vaccinations.fullPageEmptyDescription')}</p>
          <button
            type="button"
            className="ph-button ph-button--primary"
            onClick={() => setIsAddOpen(true)}
          >
            {t('vaccinations.addVaccinationAction')}
          </button>
        </div>
      ) : null}

      {!error && !isInitialLoading && total === 0 && hasActiveFilters ? (
        <div className="ph-card ph-card--pad medical-history-page__empty">
          <p className="medical-history__empty-title">{t('vaccinations.filteredEmptyTitle')}</p>
          <p>{t('vaccinations.filteredEmptyDescription')}</p>
        </div>
      ) : null}

      {!error && vaccinations.length > 0 ? (
        <section className="medical-history-page__list">
          <div className="medical-history__list">
            {vaccinations.map((vaccination) => (
              <VaccinationListItem
                key={vaccination.id}
                vaccination={vaccination}
                onView={setSelectedVaccination}
              />
            ))}
          </div>
          <VaccinationsPagination
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
          {t('vaccinations.addVaccinationAction')}
        </button>
      </div>

      {patient && isAddOpen ? (
        <VaccinationFormDialog
          mode="add"
          open
          onClose={() => setIsAddOpen(false)}
          patient={patient}
          clinics={clinics}
          onSuccess={() => void refetch()}
        />
      ) : null}

      {patient && editVaccination ? (
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

      {patient ? (
        <VaccinationDetailDialog
          vaccination={selectedVaccination}
          patient={patient}
          onClose={() => setSelectedVaccination(null)}
          onEdit={(record) => {
            setSelectedVaccination(null);
            setEditVaccination(record);
          }}
        />
      ) : null}
    </div>
  );
}
