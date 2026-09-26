export type PatientOwner = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
};

export type PatientClinicAccess = {
  clinicId: string;
  accessStatus: string;
  grantedAt: string;
};

export type Patient = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  owner: PatientOwner;
  clinicAccesses: PatientClinicAccess[];
};

export type MyPatientsQueryResult = {
  myPatients: Patient[];
};

export type PatientQueryResult = {
  patient: Patient;
};

export type RegisterPatientOwnerInput = {
  email: string;
  firstName: string;
  lastName: string;
};

export type RegisterPatientInput = {
  clinicId: string;
  owner: RegisterPatientOwnerInput;
  name: string;
  species: string;
  breed?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
};

export type UpdatePatientOwnerInput = {
  firstName: string;
  lastName: string;
  email: string;
};

export type UpdatePatientInput = {
  name?: string;
  species?: string;
  breed?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  owner?: UpdatePatientOwnerInput;
};
