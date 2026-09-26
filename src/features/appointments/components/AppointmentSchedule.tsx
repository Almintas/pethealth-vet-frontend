import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { VetAppointment } from '../types';
import {
  formatAppointmentTime,
  getOwnerFullName,
  getSpeciesTypeLine,
} from '../utils/appointment-display';
import './appointment-schedule.css';

type AppointmentScheduleProps = {
  title: string;
  appointments: VetAppointment[];
  showDateHeaders?: boolean;
  showViewPatientLink?: boolean;
  onSelect: (appointment: VetAppointment) => void;
};

export function AppointmentSchedule({
  title,
  appointments,
  showViewPatientLink = false,
  onSelect,
}: AppointmentScheduleProps) {
  const { t, i18n } = useTranslation();

  if (!appointments.length) {
    return null;
  }

  return (
    <section className="appointments-section">
      <h2 className="appointments-section__title">{title}</h2>
      <ul className="appointments-list">
        {appointments.map((appointment) => (
          <li key={appointment.id}>
            <button
              type="button"
              className="ph-card ph-card--pad appointment-row"
              onClick={() => onSelect(appointment)}
            >
              <div className="appointment-row__main">
                <time
                  className="appointment-row__time"
                  dateTime={appointment.scheduledAt}
                >
                  {formatAppointmentTime(appointment.scheduledAt, i18n.language)}
                </time>
                <div>
                  <h3 className="appointment-row__name">{appointment.patient.name}</h3>
                  <p className="appointment-row__meta">
                    {getSpeciesTypeLine(appointment, t)}
                  </p>
                  <p className="appointment-row__meta">
                    {t('appointments.ownerLabel', {
                      name: getOwnerFullName(appointment),
                    })}
                  </p>
                </div>
              </div>
              <div className="appointment-row__aside">
                <span className="appointment-row__status">
                  {t(`enums.appointmentStatus.${appointment.status}`)}
                </span>
                {showViewPatientLink ? (
                  <Link
                    className="appointment-row__patient-link"
                    to={`/patients/${appointment.petId}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {t('appointments.viewPatientArrow')}
                  </Link>
                ) : null}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
