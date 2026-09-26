import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { PATIENT_QUERY } from '../../patients/graphql';
import type { PatientQueryResult } from '../../patients/types';
import { getSpeciesBreedLine } from '../../patients/utils/patient-display';
import { AppointmentDetailDialog } from '../components/AppointmentDetailDialog';
import { AppointmentFormDialog } from '../components/AppointmentFormDialog';
import { AppointmentSchedule } from '../components/AppointmentSchedule';
import { usePatientAppointments } from '../hooks/use-patient-appointments';
import type { VetAppointment } from '../types';
import { startOfLocalDay } from '../utils/appointment-display';
import '../../medical-records/components/medical-history.css';
import '../../medical-records/pages/patient-medical-history-page.css';

export function PatientAppointmentsPage() {
  const { t } = useTranslation();
  const { id: patientId } = useParams<{ id: string }>();
  const [selectedAppointment, setSelectedAppointment] = useState<VetAppointment | null>(null);
  const [editAppointment, setEditAppointment] = useState<VetAppointment | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const scheduledFrom = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 180);
    return from.toISOString();
  }, []);
  const scheduledTo = useMemo(() => {
    const to = new Date();
    to.setFullYear(to.getFullYear() + 1);
    return to.toISOString();
  }, []);

  const { data: patientData, loading: patientLoading } = useQuery<PatientQueryResult>(
    PATIENT_QUERY,
    {
      variables: { id: patientId ?? '' },
      skip: !patientId,
    },
  );

  const { appointments, loading, error, refetch } = usePatientAppointments({
    patientId: patientId ?? '',
    scheduleQuery: { scheduledFrom, scheduledTo },
    skip: !patientId,
  });

  const patient = patientData?.patient;
  const now = startOfLocalDay(new Date()).getTime();

  const upcoming = useMemo(
    () =>
      appointments
        .filter((item) => new Date(item.scheduledAt).getTime() >= now)
        .sort(
          (left, right) =>
            new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
        ),
    [appointments, now],
  );

  const past = useMemo(
    () =>
      appointments
        .filter((item) => new Date(item.scheduledAt).getTime() < now)
        .sort(
          (left, right) =>
            new Date(right.scheduledAt).getTime() - new Date(left.scheduledAt).getTime(),
        ),
    [appointments, now],
  );

  if (!patientId) {
    return null;
  }

  const isInitialLoading =
    (loading && appointments.length === 0) || (patientLoading && !patient);

  return (
    <div className="ph-page medical-history-page">
      <Link className="patient-profile__back" to={`/patients/${patientId}`}>
        ← {t('appointments.backToPatient', { name: patient?.name ?? t('appointments.patient') })}
      </Link>

      {isInitialLoading ? (
        <LoadingState message={t('appointments.loading')} skeleton skeletonLines={4} />
      ) : null}

      {patient ? (
        <header className="medical-history-page__header ph-card ph-card--pad">
          <p className="medical-history-page__eyebrow">{t('appointments.title')}</p>
          <h1 className="medical-history-page__title">{patient.name}</h1>
          <p className="medical-history-page__subtitle">{getSpeciesBreedLine(patient)}</p>
          <p className="medical-history-page__context">
            {t('appointments.patientAppointmentsFor', { name: patient.name })}
          </p>
        </header>
      ) : null}

      {error ? (
        <ErrorAlert
          title={t('appointments.loadErrorTitle')}
          message={t('appointments.loadErrorDescription')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!error && !isInitialLoading && appointments.length === 0 ? (
        <div className="ph-card ph-card--pad medical-history-page__empty">
          <p className="medical-history__empty-title">{t('appointments.patientNoAppointments')}</p>
          <p>{t('appointments.emptyDescription')}</p>
          <button
            type="button"
            className="ph-button ph-button--primary"
            onClick={() => setIsAddOpen(true)}
          >
            {t('appointments.newAppointmentAction')}
          </button>
        </div>
      ) : null}

      {!error && upcoming.length > 0 ? (
        <AppointmentSchedule
          title={t('appointments.upcoming')}
          appointments={upcoming}
          onSelect={setSelectedAppointment}
          showViewPatientLink
        />
      ) : null}

      {!error && past.length > 0 ? (
        <AppointmentSchedule
          title={t('appointments.past')}
          appointments={past}
          onSelect={setSelectedAppointment}
          showViewPatientLink
        />
      ) : null}

      <div className="medical-history-page__add">
        <button
          type="button"
          className="ph-button ph-button--primary"
          onClick={() => setIsAddOpen(true)}
        >
          {t('appointments.newAppointmentAction')}
        </button>
      </div>

      <AppointmentFormDialog
        mode="add"
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        defaultPetId={patientId}
      />
      <AppointmentFormDialog
        mode="edit"
        open={Boolean(editAppointment)}
        onClose={() => setEditAppointment(null)}
        appointment={editAppointment ?? undefined}
      />
      <AppointmentDetailDialog
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onEdit={(record) => {
          setSelectedAppointment(null);
          setEditAppointment(record);
        }}
      />
    </div>
  );
}
