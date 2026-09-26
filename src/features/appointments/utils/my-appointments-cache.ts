import type { ApolloCache } from '@apollo/client';
import { MY_APPOINTMENTS_QUERY } from '../graphql';
import type {
  AppointmentsScheduleQueryInput,
  MyAppointmentsQueryResult,
  VetAppointment,
} from '../types';

function sortByScheduledAt(appointments: VetAppointment[]): VetAppointment[] {
  return [...appointments].sort(
    (left, right) =>
      new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
  );
}

type MyAppointmentsCacheOptions = {
  scheduleQuery?: AppointmentsScheduleQueryInput;
};

export function myAppointmentsQueryOptions(
  scheduleQuery?: AppointmentsScheduleQueryInput,
): { query: typeof MY_APPOINTMENTS_QUERY; variables?: { query: AppointmentsScheduleQueryInput } } {
  if (!scheduleQuery) {
    return { query: MY_APPOINTMENTS_QUERY };
  }
  return { query: MY_APPOINTMENTS_QUERY, variables: { query: scheduleQuery } };
}

export function upsertMyAppointmentsCache(
  cache: ApolloCache,
  appointment: VetAppointment,
  options: MyAppointmentsCacheOptions = {},
): void {
  const queryOptions = myAppointmentsQueryOptions(options.scheduleQuery);
  cache.updateQuery<MyAppointmentsQueryResult>(queryOptions, (existing) => {
    const current = existing?.myAppointments ?? [];
    const index = current.findIndex((item) => item.id === appointment.id);
    if (index === -1) {
      return { myAppointments: sortByScheduledAt([...current, appointment]) };
    }
    const next = [...current];
    next[index] = appointment;
    return { myAppointments: sortByScheduledAt(next) };
  });
}

export function myAppointmentsRefetchList(
  scheduleQuery?: AppointmentsScheduleQueryInput,
) {
  return [myAppointmentsQueryOptions(scheduleQuery)];
}
