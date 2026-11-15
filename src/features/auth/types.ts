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
  twoFactorEnabled: boolean;
  veterinarianProfile?: VeterinarianProfile | null;
};

export type AuthPayload = {
  accessToken: string | null;
  user: AuthUser | null;
  twoFactorRequired?: boolean;
  twoFactorToken?: string | null;
};

/** Login either signs in, or asks for an authenticator code first. */
export type LoginResult =
  | { status: 'signed-in'; user: AuthUser }
  | { status: 'two-factor-required'; twoFactorToken: string };

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
