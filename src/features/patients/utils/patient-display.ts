import type { TFunction } from 'i18next';
import type { Patient } from '../types';
import { translatePetBreed, translatePetSpecies } from './pet-field-display';

export function getOwnerFullName(patient: Patient): string {
  return `${patient.owner.firstName} ${patient.owner.lastName}`.trim();
}

/** "Katė · Meino meškėnas" — species and breed in the current language. */
export function getSpeciesBreedLine(
  patient: Pick<Patient, 'species' | 'breed'>,
  t: TFunction,
): string {
  const parts = [translatePetSpecies(patient.species, t)];
  const breed = patient.breed?.trim();
  if (breed) {
    parts.push(translatePetBreed(breed, t));
  }
  return parts.filter(Boolean).join(' · ');
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
