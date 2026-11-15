export type ClinicMemberRole = 'ADMIN' | 'VETERINARIAN' | 'RECEPTIONIST';

export type Clinic = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  myRole?: ClinicMemberRole | null;
};

export type MyClinicsQueryResult = {
  myClinics: Clinic[];
};

export type CreateClinicInput = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type CreateClinicMutationResult = {
  createClinic: Clinic;
};

/** Roles the API allows to create a clinic (receptionists cannot). */
export const CLINIC_CREATOR_ROLES = ['VETERINARIAN', 'CLINIC_ADMIN'] as const;
