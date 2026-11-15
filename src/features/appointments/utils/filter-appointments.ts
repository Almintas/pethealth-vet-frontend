import { normalizeAppointmentTypeValue } from '../constants/appointment-types';
import type { AppointmentStatus, VetAppointment } from '../types';

export type AppointmentFilters = {
  searchTerm: string;
  status: AppointmentStatus | 'ALL';
  type: string | 'ALL';
};

export function filterAppointments(
  appointments: VetAppointment[],
  filters: AppointmentFilters,
): VetAppointment[] {
  const query = filters.searchTerm.trim().toLowerCase();

  return appointments.filter((appointment) => {
    if (filters.status !== 'ALL' && appointment.status !== filters.status) {
      return false;
    }
    if (
      filters.type !== 'ALL' &&
      normalizeAppointmentTypeValue(appointment.type) !== filters.type
    ) {
      return false;
    }
    if (!query) {
      return true;
    }

    const ownerName = `${appointment.patient.ownerFirstName} ${appointment.patient.ownerLastName}`;
    const haystack = [
      appointment.patient.name,
      ownerName,
      appointment.patient.ownerEmail ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}
