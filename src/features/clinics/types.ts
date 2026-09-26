export type Clinic = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

export type ClinicMembership = {
  id: string;
  status: string;
  clinic: Clinic;
};

export type CreateClinicInput = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type MyClinicsQueryResult = {
  myClinics: ClinicMembership[];
};

export type CreateClinicMutationResult = {
  createClinic: Clinic;
};
