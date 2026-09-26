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
  const mapOne = (appointment: VetAppointment): DashboardAppointment => ({
    id: appointment.id,
    patientId: appointment.petId,
    petName: appointment.patient.name,
    species: appointment.patient.species,
    appointmentType: appointment.type,
    ownerName: `${appointment.patient.ownerFirstName} ${appointment.patient.ownerLastName}`.trim(),
    status: appointment.status,
    time: formatAppointmentTime(appointment.scheduledAt, locale),
  });

  return {
    today: grouped.today.map(mapOne),
    upcoming: grouped.upcoming.slice(0, 5).map(mapOne),
  };
}
