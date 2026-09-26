export const APPOINTMENT_TYPE_OPTIONS = [
  { value: 'CHECKUP' },
  { value: 'VACCINATION' },
  { value: 'ILLNESS' },
  { value: 'FOLLOW_UP' },
  { value: 'SURGERY' },
  { value: 'DENTAL' },
  { value: 'EMERGENCY' },
  { value: 'OTHER' },
] as const;

export type AppointmentTypeValue =
  (typeof APPOINTMENT_TYPE_OPTIONS)[number]['value'];

export const DEFAULT_APPOINTMENT_TYPE: AppointmentTypeValue = 'CHECKUP';

export function normalizeAppointmentTypeValue(raw: string): AppointmentTypeValue {
  const normalized = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const match = APPOINTMENT_TYPE_OPTIONS.find((option) => option.value === normalized);
  return match?.value ?? 'OTHER';
}
