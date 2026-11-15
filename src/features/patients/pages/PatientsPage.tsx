import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { EmptyStateIcon } from '../../../components/feedback/EmptyStateIcon';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { MY_CLINICS_QUERY } from '../../clinics/graphql';
import type { MyClinicsQueryResult } from '../../clinics/types';
import { ClaimPatientDialog } from '../components/ClaimPatientDialog';
import { PatientCard } from '../components/PatientCard';
import { PatientFormDialog } from '../components/PatientFormDialog';
import { MY_PATIENTS_QUERY } from '../graphql';
import type { MyPatientsQueryResult, Patient } from '../types';
import {
  ALL_GENDERS,
  ALL_SPECIES,
  collectGenderOptions,
  collectSpeciesOptions,
  filterPatients,
  hasActivePatientFilters,
} from '../utils/filter-patients';
import '../components/patient-card.css';
import { translatePetSpecies } from '../utils/pet-field-display';

const EMPTY_PATIENTS: MyPatientsQueryResult['myPatients'] = [];

export function PatientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState(ALL_SPECIES);
  const [genderFilter, setGenderFilter] = useState(ALL_GENDERS);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);

  const { data, loading, error, refetch } = useQuery<MyPatientsQueryResult>(
    MY_PATIENTS_QUERY,
    { fetchPolicy: 'cache-and-network' },
  );

  const { data: clinicsData } = useQuery<MyClinicsQueryResult>(MY_CLINICS_QUERY);
  const clinics = clinicsData?.myClinics ?? [];
  const canRegisterPatients = clinics.length > 0;

  const patients = data?.myPatients ?? EMPTY_PATIENTS;
  const speciesOptions = useMemo(() => collectSpeciesOptions(patients), [patients]);
  const genderOptions = useMemo(() => collectGenderOptions(patients), [patients]);

  const listFilters = useMemo(
    () => ({
      searchTerm,
      species: speciesFilter,
      gender: genderFilter,
    }),
    [searchTerm, speciesFilter, genderFilter],
  );

  const filteredPatients = useMemo(
    () => filterPatients(patients, listFilters),
    [patients, listFilters],
  );

  const filtersActive = hasActivePatientFilters(listFilters);
  const isInitialLoading = loading && patients.length === 0;
  const showTrueEmpty = !isInitialLoading && !error && patients.length === 0;
  const showFilteredEmpty =
    !isInitialLoading &&
    !error &&
    patients.length > 0 &&
    filteredPatients.length === 0 &&
    filtersActive;

  const countLabel = useMemo(() => {
    const total = patients.length;
    const shown = filteredPatients.length;
    if (filtersActive && shown !== total) {
      return t('patients.countFiltered', { shown, total });
    }
    return t('patients.count', { count: total, defaultValue: `${total} patients` });
  }, [patients.length, filteredPatients.length, filtersActive, t]);

  const openAddDialog = () => {
    if (canRegisterPatients) {
      setIsAddDialogOpen(true);
    }
  };

  return (
    <div className="ph-page">
      <header className="ph-page-header">
        <div>
          <p className="ph-page-header__eyebrow">{t('patients.eyebrow')}</p>
          <h1 className="ph-page-header__title">{t('patients.title')}</h1>
          <p className="ph-page-header__subtitle">{t('patients.subtitle')}</p>
        </div>
        <div className="patients-header-actions">
          <button
            type="button"
            className="ph-button ph-button--secondary"
            onClick={() => setIsClaimDialogOpen(true)}
            disabled={!canRegisterPatients}
            title={
              canRegisterPatients
                ? t('patients.claim.actionHint')
                : t('patients.addPatientDisabledHint')
            }
          >
            {t('patients.claim.action')}
          </button>
          <button
            type="button"
            className="ph-button ph-button--primary"
            onClick={openAddDialog}
            disabled={!canRegisterPatients}
            title={
              canRegisterPatients ? undefined : t('patients.addPatientDisabledHint')
            }
          >
            {t('patients.addPatientAction')}
          </button>
        </div>
      </header>

      {!isInitialLoading && !error && patients.length > 0 ? (
        <>
          <div className="patients-toolbar">
            <label className="ph-field patients-toolbar__search">
              <span className="ph-visually-hidden">{t('patients.searchLabel')}</span>
              <input
                type="search"
                className="ph-field__input"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('patients.searchPlaceholder')}
                autoComplete="off"
              />
            </label>
            <div className="patients-toolbar__filters">
              <label className="ph-field patients-toolbar__filter">
                <span className="ph-field__label">{t('patients.species')}</span>
                <select
                  className="ph-field__input"
                  value={speciesFilter}
                  onChange={(event) => setSpeciesFilter(event.target.value)}
                >
                  <option value={ALL_SPECIES}>{t('patients.allSpecies')}</option>
                  {speciesOptions.map((species) => (
                    <option key={species} value={species}>
                      {translatePetSpecies(species, t)}
                    </option>
                  ))}
                </select>
              </label>
              {genderOptions.length > 0 ? (
                <label className="ph-field patients-toolbar__filter">
                  <span className="ph-field__label">{t('patients.gender')}</span>
                  <select
                    className="ph-field__input"
                    value={genderFilter}
                    onChange={(event) => setGenderFilter(event.target.value)}
                  >
                    <option value={ALL_GENDERS}>{t('patients.allGenders')}</option>
                    {genderOptions.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </div>
          <p className="patients-list-count">{countLabel}</p>
        </>
      ) : null}

      {isInitialLoading ? (
        <LoadingState message={t('patients.loading')} skeleton skeletonLines={4} />
      ) : null}

      {error ? (
        <ErrorAlert
          title={t('patients.loadErrorTitle')}
          message={t('patients.loadErrorDescription')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {showTrueEmpty ? (
        <EmptyState
          icon={<EmptyStateIcon />}
          title={t('patients.emptyTitle')}
          description={t('patients.emptyDescription')}
        />
      ) : null}

      {showFilteredEmpty ? (
        <EmptyState
          title={t('patients.searchEmptyTitle')}
          description={t('patients.searchEmptyDescription')}
        />
      ) : null}

      {!error && filteredPatients.length > 0 ? (
        <div className="patients-grid">
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onEdit={setEditPatient}
            />
          ))}
        </div>
      ) : null}

      <PatientFormDialog
        mode="add"
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        clinics={clinics}
        onCreated={(patientId) => {
          setIsAddDialogOpen(false);
          void navigate(`/patients/${patientId}`);
        }}
      />
      <ClaimPatientDialog
        open={isClaimDialogOpen}
        onClose={() => setIsClaimDialogOpen(false)}
        clinics={clinics}
        onClaimed={(patientId) => void navigate(`/patients/${patientId}`)}
      />
      <PatientFormDialog
        mode="edit"
        open={Boolean(editPatient)}
        onClose={() => setEditPatient(null)}
        patient={editPatient ?? undefined}
        clinics={clinics}
      />
    </div>
  );
}
