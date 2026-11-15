import type { AccountApprovalStatus } from '../auth/types';

export const PLATFORM_ADMIN_ROLE = 'PLATFORM_ADMIN';
export const ADMIN_HOME = '/admin/veterinarians';

export type AdminVeterinarian = {
  userId: string;
  email: string;
  role: string;
  approvalStatus: AccountApprovalStatus;
  firstName?: string | null;
  lastName?: string | null;
  licenseNumber?: string | null;
  registeredAt: string;
  decidedBy?: string | null;
  decidedAt?: string | null;
};

export type AdminVeterinariansQueryResult = {
  adminVeterinarians: AdminVeterinarian[];
};

export type AdminVeterinariansQueryVariables = {
  status?: AccountApprovalStatus | null;
};

export type AdminStatusFilter = AccountApprovalStatus | 'ALL';
