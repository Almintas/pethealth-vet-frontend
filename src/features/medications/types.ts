export type VetMedicationPatient = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail?: string | null;
};

export type VetMedication = {
  id: string;
  petId: string;
  name: string;
  dosage: number;
  dosageUnit: string;
  frequency: string;
  startDate: string;
  endDate?: string | null;
  veterinarianName?: string | null;
  clinicName?: string | null;
  notes?: string | null;
  isActive: boolean;
  patient: VetMedicationPatient;
};

export type PatientMedicationsPage = {
  items: VetMedication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  activeTotal: number;
};

export type PatientMedicationsPageQueryInput = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
};

export type PatientMedicationsPageQueryResult = {
  patientMedicationsPage: PatientMedicationsPage;
};

export type CreateVetMedicationInput = {
  clinicId: string;
  petId: string;
  name: string;
  dosage: number;
  dosageUnit: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  notes?: string;
};

export type UpdateVetMedicationInput = {
  name?: string;
  dosage?: number;
  dosageUnit?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  isActive?: boolean;
};
