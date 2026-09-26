import type { VetAppointment } from '../types';

export function getOwnerFullName(appointment: VetAppointment): string {
  return `${appointment.patient.ownerFirstName} ${appointment.patient.ownerLastName}`.trim();
}

export function getSpeciesTypeLine(appointment: VetAppointment): string {
  const species = appointment.patient.species.trim();
  const type = appointment.type.trim();
  return `${species} · ${type}`;
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
