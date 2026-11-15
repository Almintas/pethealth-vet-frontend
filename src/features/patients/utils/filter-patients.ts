import type { Patient } from '../types';

export type PatientListFilters = {
  searchTerm: string;
  species: string;
  gender: string;
};

export const ALL_SPECIES = '__all_species__';
export const ALL_GENDERS = '__all_genders__';

function normalizeSearchTerm(term: string): string {
  return term.trim().toLowerCase();
}

export function filterPatients(
  patients: Patient[],
  filters: PatientListFilters,
): Patient[] {
  const query = normalizeSearchTerm(filters.searchTerm);
  const speciesFilter = filters.species;
  const genderFilter = filters.gender;

  return patients.filter((patient) => {
    if (speciesFilter !== ALL_SPECIES) {
      if (patient.species.trim().toLowerCase() !== speciesFilter.toLowerCase()) {
        return false;
      }
    }
    if (genderFilter !== ALL_GENDERS) {
      const patientGender = patient.gender?.trim().toLowerCase() ?? '';
      if (patientGender !== genderFilter.toLowerCase()) {
        return false;
      }
    }

    if (!query) {
      return true;
    }

    const owner = patient.owner;
    const speciesBreed = [patient.species, patient.breed ?? ''].filter(Boolean).join(' ');
    const haystack = [
      patient.name,
      patient.species,
      patient.breed ?? '',
      speciesBreed,
      owner.firstName,
      owner.lastName,
      `${owner.firstName} ${owner.lastName}`,
      owner.email ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function collectSpeciesOptions(patients: Patient[]): string[] {
  const values = new Set<string>();
  for (const patient of patients) {
    const species = patient.species.trim();
    if (species) {
      values.add(species);
    }
  }
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function collectGenderOptions(patients: Patient[]): string[] {
  const values = new Set<string>();
  for (const patient of patients) {
    const gender = patient.gender?.trim();
    if (gender) {
      values.add(gender);
    }
  }
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function hasActivePatientFilters(filters: PatientListFilters): boolean {
  return (
    filters.searchTerm.trim().length > 0 ||
    filters.species !== ALL_SPECIES ||
    filters.gender !== ALL_GENDERS
  );
}
