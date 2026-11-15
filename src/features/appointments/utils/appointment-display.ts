import { normalizeAppointmentTypeValue } from '../constants/appointment-types';
import type { VetAppointment } from '../types';

export function getLocalizedAppointmentTypeLabel(
  appointment: VetAppointment,
  translate: (key: string) => string,
): string {
  const typeKey = normalizeAppointmentTypeValue(appointment.type);
  return translate(`enums.appointmentType.${typeKey}`);
}

export function getOwnerFullName(appointment: VetAppointment): string {
  return `${appointment.patient.ownerFirstName} ${appointment.patient.ownerLastName}`.trim();
}

export function getSpeciesTypeLine(
  appointment: VetAppointment,
  translate: (key: string) => string,
): string {
  const species = appointment.patient.species.trim();
  const typeLabel = getLocalizedAppointmentTypeLabel(appointment, translate);
  return `${species} · ${typeLabel}`;
}

export function formatAppointmentTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatAppointmentDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
