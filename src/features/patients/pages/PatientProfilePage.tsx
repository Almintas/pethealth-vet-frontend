import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { MedicalHistorySection } from '../../medical-records/components/MedicalHistorySection';
import { MedicationsSection } from '../../medications/components/MedicationsSection';
import { AppointmentsSection } from '../../appointments/components/AppointmentsSection';
import { VaccinationsSection } from '../../vaccinations/components/VaccinationsSection';
import { PatientClinicalSummary } from '../components/PatientClinicalSummary';
import { MY_CLINICS_QUERY } from '../../clinics/graphql';
import type { MyClinicsQueryResult } from '../../clinics/types';
import { PatientFormDialog } from '../components/PatientFormDialog';
import { PATIENT_QUERY } from '../graphql';
import type { PatientQueryResult } from '../types';
import {
  formatPatientDateOfBirth,
  getOwnerFullName,
  getSpeciesBreedLine,
} from '../utils/patient-display';
import '../components/patient-profile.css';

export function PatientProfilePage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery<PatientQueryResult>(
    PATIENT_QUERY,
    {
      variables: { id: id ?? '' },
      skip: !id,
      fetchPolicy: 'cache-and-network',
    },
  );

  const { data: clinicsData } = useQuery<MyClinicsQueryResult>(MY_CLINICS_QUERY);
  const patient = data?.patient;
  const isInitialLoading = loading && !patient;

  if (!id) {
    return null;
  }

  const clinics =
    clinicsData?.myClinics?.map((clinic) => ({
      id: clinic.id,
      name: clinic.name,
    })) ?? [];

  return (
    <div className="ph-page patient-profile">
      <Link className="patient-profile__back" to="/patients">
        ← {t('patients.backToList')}
      </Link>

      {isInitialLoading ? (
        <LoadingState message={t('patients.profileLoading')} skeleton skeletonLines={4} />
      ) : null}

      {error ? (
        <ErrorAlert
          title={t('patients.profileLoadErrorTitle')}
          message={
            getAuthErrorMessage(error, 'load-profile') ||
            t('patients.profileLoadErrorDescription')
          }
          onRetry={() => void refetch()}
        />
      ) : null}

      {patient ? (
        <div className="ph-card ph-card--pad patient-profile__sheet">
          <header className="patient-profile__header">
            <div>
              <h1 className="patient-profile__name">{patient.name}</h1>
              <p className="patient-profile__species">{getSpeciesBreedLine(patient)}</p>
            </div>
            <button
              type="button"
              className="ph-button ph-button--primary"
              onClick={() => setIsEditOpen(true)}
            >
              {t('patients.editPatient')}
            </button>
          </header>

          <section className="patient-profile__block">
            <h2 className="patient-profile__block-title">{t('patients.owner')}</h2>
            <p className="patient-profile__value">{getOwnerFullName(patient)}</p>
            {patient.owner.email ? (
              <p className="patient-profile__muted">{patient.owner.email}</p>
            ) : null}
          </section>

          <section className="patient-profile__block">
            <h2 className="patient-profile__block-title">{t('patients.patientOverview')}</h2>
            <dl className="patient-profile__details">
              <div>
                <dt>{t('patients.gender')}</dt>
                <dd>{patient.gender ?? t('common.notProvided')}</dd>
              </div>
              <div>
                <dt>{t('patients.dateOfBirth')}</dt>
                <dd>
                  {formatPatientDateOfBirth(patient.dateOfBirth, i18n.language) ??
                    t('common.notProvided')}
                </dd>
              </div>
              <div>
                <dt>{t('patients.species')}</dt>
                <dd>{patient.species}</dd>
              </div>
              <div>
                <dt>{t('patients.breed')}</dt>
                <dd>{patient.breed?.trim() || t('common.notProvided')}</dd>
              </div>
            </dl>
          </section>

          <PatientClinicalSummary patientId={patient.id} />

          <MedicalHistorySection patient={patient} clinics={clinics} />

          <MedicationsSection patient={patient} clinics={clinics} />

          <VaccinationsSection patient={patient} clinics={clinics} />

          <AppointmentsSection patient={patient} />

          <PatientFormDialog
            mode="edit"
            open={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            patient={patient}
            clinics={clinicsData?.myClinics ?? []}
            onSuccess={() => void refetch()}
          />
        </div>
      ) : null}
    </div>
  );
}
