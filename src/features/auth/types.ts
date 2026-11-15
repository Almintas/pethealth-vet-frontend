export type VeterinarianProfile = {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber?: string | null;
};

export type AccountApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  approvalStatus: AccountApprovalStatus;
  veterinarianProfile?: VeterinarianProfile | null;
};

export type AuthPayload = {
  accessToken: string;
  user: AuthUser;
};

export type RegisterWithInvitationInput = {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
  licenseNumber?: string;
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
  licenseNumber: string;
};
