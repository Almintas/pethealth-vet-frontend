export type VeterinarianProfile = {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber?: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  veterinarianProfile?: VeterinarianProfile | null;
};

export type AuthPayload = {
  accessToken: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterVeterinarianInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  licenseNumber?: string;
};
