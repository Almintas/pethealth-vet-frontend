export type VetVaccinationPatient = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail?: string | null;
};

export type VetVaccination = {
  id: string;
  petId: string;
  vaccineName: string;
  administeredAt: string;
  nextDueAt?: string | null;
  veterinarianName?: string | null;
  clinicName?: string | null;
  batchNumber?: string | null;
  notes?: string | null;
  patient: VetVaccinationPatient;
};

export type PatientVaccinationsPage = {
  items: VetVaccination[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextDueVaccineName?: string | null;
  nextDueAt?: string | null;
};

export type PatientVaccinationsPageQueryInput = {
  page?: number;
  limit?: number;
  search?: string;
  vaccineName?: string;
  administeredFrom?: string;
  administeredTo?: string;
  upcomingOnly?: boolean;
};

export type PatientVaccinationsPageQueryResult = {
  patientVaccinationsPage: PatientVaccinationsPage;
};
