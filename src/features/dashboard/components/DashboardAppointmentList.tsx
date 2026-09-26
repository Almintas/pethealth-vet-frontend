import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { normalizeAppointmentTypeValue } from '../../appointments/constants/appointment-types';

/** Ready for backend integration — populate from GraphQL when available. */
export type DashboardAppointment = {
  id: string;
  time: string;
  petName: string;
  species?: string | null;
  appointmentType: string;
  ownerName: string;
  status: string;
  patientId?: string | null;
};

type DashboardAppointmentListProps = {
  appointments: DashboardAppointment[];
  emptyTitle: string;
  emptyDescription: string;
};

export function DashboardAppointmentList({
  appointments,
  emptyTitle,
  emptyDescription,
}: DashboardAppointmentListProps) {
  const { t } = useTranslation();

  if (appointments.length === 0) {
    return (
      <EmptyState
        section
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ul className="dashboard-appointment-list">
      {appointments.map((appointment) => (
        <li key={appointment.id}>
          <article className="ph-card ph-card--pad dashboard-appointment-card">
            <div className="dashboard-appointment-card__main">
              <time className="dashboard-appointment-card__time" dateTime={appointment.time}>
                {appointment.time}
              </time>
              <div>
                <h3 className="dashboard-appointment-card__pet">{appointment.petName}</h3>
                {appointment.species ? (
                  <p className="dashboard-appointment-card__meta">{appointment.species}</p>
                ) : null}
                <p className="dashboard-appointment-card__meta">
                  {t(
                    `enums.appointmentType.${normalizeAppointmentTypeValue(appointment.appointmentType)}`,
                  )}
                  {' · '}
                  {appointment.ownerName}
                </p>
              </div>
            </div>
            <div className="dashboard-appointment-card__aside">
              <span className="ph-badge">
                {t(`enums.appointmentStatus.${appointment.status}`)}
              </span>
              {appointment.patientId ? (
                <Link
                  className="ph-link-button"
                  to={`/patients/${appointment.patientId}`}
                >
                  {t('dashboard.viewPatient')}
                </Link>
              ) : (
                <span className="dashboard-appointment-card__action-placeholder">
                  {t('dashboard.viewPatient')}
                </span>
              )}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
