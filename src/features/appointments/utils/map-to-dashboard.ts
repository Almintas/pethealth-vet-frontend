import type { DashboardAppointment } from '../../dashboard/components/DashboardAppointmentList';
import type { VetAppointment } from '../types';
import { formatAppointmentTime } from './appointment-display';
import { groupAppointments } from './group-appointments';

export function mapAppointmentsToDashboard(
  appointments: VetAppointment[],
  locale: string,
): {
  today: DashboardAppointment[];
  upcoming: DashboardAppointment[];
} {
  const grouped = groupAppointments(appointments);
  // "lapkričio 16 d." / "16 November"
  const dayFormatter = new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
  });
  const mapOne = (
    appointment: VetAppointment,
    withDate: boolean,
  ): DashboardAppointment => ({
    id: appointment.id,
    patientId: appointment.petId,
    petName: appointment.patient.name,
    species: appointment.patient.species,
    appointmentType: appointment.type,
    ownerName: `${appointment.patient.ownerFirstName} ${appointment.patient.ownerLastName}`.trim(),
    status: appointment.status,
    time: formatAppointmentTime(appointment.scheduledAt, locale),
    scheduledAt: appointment.scheduledAt,
    dateLabel: withDate
      ? dayFormatter.format(new Date(appointment.scheduledAt))
      : undefined,
  });

  return {
    today: grouped.today.map((appointment) => mapOne(appointment, false)),
    upcoming: grouped.upcoming
      .slice(0, 5)
      .map((appointment) => mapOne(appointment, true)),
  };
}
