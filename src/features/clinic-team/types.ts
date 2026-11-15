import type { AccountApprovalStatus } from '../auth/types';
import type { ClinicMemberRole } from '../clinics/types';

export const CLINIC_MEMBER_ROLES: ClinicMemberRole[] = [
  'VETERINARIAN',
  'RECEPTIONIST',
  'ADMIN',
];

export type ClinicMember = {
  membershipId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  role: ClinicMemberRole;
  approvalStatus: AccountApprovalStatus;
  joinedAt: string;
  isMe: boolean;
};

export type ClinicInvitation = {
  id: string;
  email: string;
  role: ClinicMemberRole;
  expiresAt: string;
  createdAt: string;
};

export type ClinicInvitationState = 'VALID' | 'EXPIRED' | 'USED' | 'REVOKED';

export type ClinicInvitationPreview = {
  state: ClinicInvitationState;
  clinicName?: string | null;
  email?: string | null;
  role?: ClinicMemberRole | null;
  accountExists: boolean;
};

export type InviteClinicMemberResult = {
  inviteClinicMember: {
    inviteUrl: string;
    emailSent: boolean;
    invitation: ClinicInvitation;
  };
};
