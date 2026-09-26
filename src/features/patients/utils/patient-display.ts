import type { Patient } from '../types';

export function getOwnerFullName(patient: Patient): string {
  return `${patient.owner.firstName} ${patient.owner.lastName}`.trim();
}

export function getSpeciesBreedLine(patient: Patient): string {
  const parts = [patient.species.trim()];
  const breed = patient.breed?.trim();
  if (breed) {
    parts.push(breed);
  }
  return parts.join(' · ');
}

export function formatPatientDateOfBirth(
  dateOfBirth: string | null | undefined,
  locale: string,
): string | null {
  if (!dateOfBirth) {
    return null;
  }
  const date = new Date(dateOfBirth);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
