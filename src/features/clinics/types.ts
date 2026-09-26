export type Clinic = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MyClinicsQueryResult = {
  myClinics: Clinic[];
};
