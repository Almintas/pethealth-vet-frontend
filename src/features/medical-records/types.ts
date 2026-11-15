export type VetMedicalRecordPatient = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail?: string | null;
};

export type VetMedicalRecord = {
  id: string;
  petId: string;
  date: string;
  type: string;
  title: string;
  description?: string | null;
  diagnosis?: string | null;
  veterinarianName?: string | null;
  clinicName?: string | null;
  notes?: string | null;
  patient: VetMedicalRecordPatient;
};

export type PatientMedicalRecordsPage = {
  items: VetMedicalRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PatientMedicalRecordsPageQueryInput = {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type PatientMedicalRecordsPageQueryResult = {
  patientMedicalRecordsPage: PatientMedicalRecordsPage;
};

export type PatientMedicalRecordsPageQueryVariables = {
  patientId: string;
  query?: PatientMedicalRecordsPageQueryInput;
};

export type VetMedicalRecordQueryResult = {
  vetMedicalRecord: VetMedicalRecord;
};

export type VetMedicalRecordQueryVariables = {
  id: string;
};

export type CreateVetMedicalRecordInput = {
  clinicId: string;
  petId: string;
  date: string;
  type: string;
  title: string;
  description?: string;
  diagnosis?: string;
  notes?: string;
};

export type UpdateVetMedicalRecordInput = {
  date?: string;
  type?: string;
  title?: string;
  description?: string;
  diagnosis?: string;
  notes?: string;
};
