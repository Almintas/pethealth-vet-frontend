import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import type { Patient } from '../../patients/types';
import {
  PROFILE_APPOINTMENTS_RECENT_LIMIT,
  PROFILE_APPOINTMENTS_UPCOMING_LIMIT,
} from '../constants/appointments-limits';
import { normalizeAppointmentTypeValue } from '../constants/appointment-types';
import { usePatientAppointments } from '../hooks/use-patient-appointments';
import type { VetAppointment } from '../types';
import {
  formatAppointmentDate,
  formatAppointmentTime,
  startOfLocalDay,
} from '../utils/appointment-display';
import { AppointmentDetailDialog } from './AppointmentDetailDialog';
import { AppointmentFormDialog } from './AppointmentFormDialog';
import '../../medical-records/components/medical-history.css';

type AppointmentsSectionProps = {
  patient: Patient;
};

export function AppointmentsSection({ patient }: AppointmentsSectionProps) {
  const { t, i18n } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<VetAppointment | null>(null);
  const [editAppointment, setEditAppointment] = useState<VetAppointment | null>(null);

  const scheduledFrom = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 90);
    return from.toISOString();
  }, []);
  const scheduledTo = useMemo(() => {
    const to = new Date();
    to.setFullYear(to.getFullYear() + 1);
    return to.toISOString();
  }, []);

  const { appointments, loading, error, refetch } = usePatientAppointments({
    patientId: patient.id,
    scheduleQuery: { scheduledFrom, scheduledTo },
  });
  const now = startOfLocalDay(new Date()).getTime();

  const upcoming = useMemo(
    () =>
      appointments
        .filter((item) => new Date(item.scheduledAt).getTime() >= now && item.status === 'SCHEDULED')
        .sort(
          (left, right) =>
            new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
        )
        .slice(0, PROFILE_APPOINTMENTS_UPCOMING_LIMIT),
    [appointments, now],
  );

  const recent = useMemo(
    () =>
      appointments
        .filter((item) => new Date(item.scheduledAt).getTime() < now || item.status !== 'SCHEDULED')
        .sort(
          (left, right) =>
            new Date(right.scheduledAt).getTime() - new Date(left.scheduledAt).getTime(),
        )
        .slice(0, PROFILE_APPOINTMENTS_RECENT_LIMIT),
    [appointments, now],
  );

  const nextUpcoming = upcoming[0];
  const appointmentsPath = `/patients/${patient.id}/appointments`;
  const isInitialLoading = loading && appointments.length === 0;

  return (
    <section
      className="patient-profile__block patient-profile__block--last"
      aria-labelledby="appointments-heading"
    >
      <div className="medical-history__header">
        <h2 id="appointments-heading" className="medical-history__title">
          {t('appointments.title')}
        </h2>
        {appointments.length > 0 ? (
          <Link className="medical-history__view-all-link" to={appointmentsPath}>
            {t('appointments.viewAll')}
          </Link>
        ) : null}
      </div>

      {isInitialLoading ? (
        <LoadingState message={t('appointments.loading')} skeleton skeletonLines={2} />
      ) : null}

      {error ? (
        <ErrorAlert
          title={t('appointments.loadErrorTitle')}
          message={t('appointments.patientLoadErrorDescription')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isInitialLoading && !error && !nextUpcoming && recent.length === 0 ? (
        <div className="medical-history__empty">
          <p className="medical-history__empty-title">{t('appointments.patientNoAppointments')}</p>
          <p>{t('appointments.emptyDescription')}</p>
        </div>
      ) : null}

      {!error && nextUpcoming ? (
        <div className="medical-history__list">
          <p className="medical-history__item-date">{t('appointments.upcomingAppointment')}</p>
          <button
            type="button"
            className="medical-history__item"
            onClick={() => setSelectedAppointment(nextUpcoming)}
          >
            <p className="medical-history__item-date">
              {formatAppointmentDate(nextUpcoming.scheduledAt, i18n.language)}{' '}
              {formatAppointmentTime(nextUpcoming.scheduledAt, i18n.language)}
            </p>
            <p className="medical-history__item-type">
              {t(
                `enums.appointmentType.${normalizeAppointmentTypeValue(nextUpcoming.type)}`,
              )}
            </p>
            <p className="medical-history__item-title">
              {t(`enums.appointmentStatus.${nextUpcoming.status}`)}
            </p>
          </button>
        </div>
      ) : null}

      {!error && recent.length > 0 ? (
        <div className="medical-history__list">
          <p className="medical-history__item-date">{t('appointments.recentAppointments')}</p>
          {recent.map((appointment) => (
            <button
              key={appointment.id}
              type="button"
              className="medical-history__item"
              onClick={() => setSelectedAppointment(appointment)}
            >
              <p className="medical-history__item-date">
                {formatAppointmentDate(appointment.scheduledAt, i18n.language)}{' '}
                {formatAppointmentTime(appointment.scheduledAt, i18n.language)}
              </p>
              <p className="medical-history__item-type">
                {t(`enums.appointmentType.${normalizeAppointmentTypeValue(appointment.type)}`)}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      <div className="medical-history__actions">
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
        defaultPetId={patient.id}
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
    </section>
  );
}
