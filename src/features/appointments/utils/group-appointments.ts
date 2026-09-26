import type { VetAppointment } from '../types';
import { isSameLocalDay, startOfLocalDay } from './appointment-display';

export type AppointmentGroupKey = 'today' | 'upcoming' | 'past';

export type GroupedAppointments = {
  today: VetAppointment[];
  upcoming: VetAppointment[];
  past: VetAppointment[];
};

export function groupAppointments(
  appointments: VetAppointment[],
  now = new Date(),
): GroupedAppointments {
  const todayStart = startOfLocalDay(now);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);
  const grouped: GroupedAppointments = {
    today: [],
    upcoming: [],
    past: [],
  };

  for (const appointment of appointments) {
    const scheduledAt = new Date(appointment.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      continue;
    }
    if (isSameLocalDay(scheduledAt, now)) {
      grouped.today.push(appointment);
      continue;
    }
    if (scheduledAt > todayEnd) {
      grouped.upcoming.push(appointment);
      continue;
    }
    if (scheduledAt < todayStart) {
      grouped.past.push(appointment);
    }
  }

  const byTime = (left: VetAppointment, right: VetAppointment) =>
    new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime();

  grouped.today.sort(byTime);
  grouped.upcoming.sort(byTime);
  grouped.past.sort((left, right) => byTime(right, left));

  return grouped;
}
