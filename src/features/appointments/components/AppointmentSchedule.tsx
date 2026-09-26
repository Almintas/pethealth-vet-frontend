import { useTranslation } from 'react-i18next';
import type { VetAppointment } from '../types';
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getOwnerFullName,
  getSpeciesTypeLine,
} from '../utils/appointment-display';
import './appointment-schedule.css';

type AppointmentScheduleProps = {
  title: string;
  appointments: VetAppointment[];
  showDateHeaders?: boolean;
  onSelect: (appointment: VetAppointment) => void;
};

export function AppointmentSchedule({
  title,
  appointments,
  showDateHeaders = false,
  onSelect,
}: AppointmentScheduleProps) {
  const { t, i18n } = useTranslation();

  if (!appointments.length) {
    return null;
  }

  const dateHeaderById = new Map<string, string>();
  if (showDateHeaders) {
    let lastDateLabel = '';
    for (const appointment of appointments) {
      const dateLabel = formatAppointmentDate(
        appointment.scheduledAt,
        i18n.language,
      );
      if (dateLabel && dateLabel !== lastDateLabel) {
        dateHeaderById.set(appointment.id, dateLabel);
        lastDateLabel = dateLabel;
      }
    }
  }

  return (
    <section className="appointments-section">
      <h2 className="appointments-section__title">{title}</h2>
      <ul className="appointments-list">
        {appointments.map((appointment) => {
          const dateLabel = dateHeaderById.get(appointment.id);

          return (
            <li key={appointment.id}>
              {dateLabel ? (
                <p className="appointment-row__date-label">{dateLabel}</p>
              ) : null}
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
                    <p className="appointment-row__meta">{getSpeciesTypeLine(appointment)}</p>
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
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
