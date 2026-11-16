export const VET_REMINDER_TYPES = ['APPOINTMENT', 'VACCINATION', 'MEDICATION', 'GENERAL'] as const;

export type VetReminderType = (typeof VET_REMINDER_TYPES)[number];

export type VetPatientReminder = {
  id: string;
  petId: string;
  type: string;
  title: string;
  message?: string | null;
  dueAt: string;
  /** PENDING, COMPLETED (by the owner) or DISMISSED */
  status: string;
  /** CLINIC or AUTOMATIC */
  managedBy: string;
  clinicId?: string | null;
  clinicName?: string | null;
  createdByName?: string | null;
  createdAt: string;
};

export type PatientRemindersQueryResult = {
  patientReminders: VetPatientReminder[];
};

/** A date input value (yyyy-mm-dd) as 09:00 local time, the usual reminder hour. */
export function reminderDueAtFromDateInput(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 9, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Upcoming pending reminders first (soonest first), then the rest, newest first. */
export function sortReminders(reminders: VetPatientReminder[]): VetPatientReminder[] {
  const pending = reminders
    .filter((reminder) => reminder.status === 'PENDING')
    .sort((left, right) => Date.parse(left.dueAt) - Date.parse(right.dueAt));
  const done = reminders
    .filter((reminder) => reminder.status !== 'PENDING')
    .sort((left, right) => Date.parse(right.dueAt) - Date.parse(left.dueAt));
  return [...pending, ...done];
}
