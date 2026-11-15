import { gql } from '@apollo/client';
import { CLINIC_FIELDS } from '../clinics/graphql';

export const CLINIC_MEMBERS_QUERY = gql`
  query ClinicMembers($clinicId: ID!) {
    clinicMembers(clinicId: $clinicId) {
      membershipId
      userId
      firstName
      lastName
      email
      role
      approvalStatus
      joinedAt
      isMe
    }
  }
`;

export const CLINIC_INVITATIONS_QUERY = gql`
  query ClinicInvitations($clinicId: ID!) {
    clinicInvitations(clinicId: $clinicId) {
      id
      email
      role
      expiresAt
      createdAt
    }
  }
`;

export const INVITE_CLINIC_MEMBER_MUTATION = gql`
  mutation InviteClinicMember($input: CreateClinicInvitationInput!) {
    inviteClinicMember(input: $input) {
      inviteUrl
      emailSent
      invitation {
        id
        email
        role
        expiresAt
        createdAt
      }
    }
  }
`;

export const REVOKE_CLINIC_INVITATION_MUTATION = gql`
  mutation RevokeClinicInvitation($invitationId: ID!) {
    revokeClinicInvitation(invitationId: $invitationId)
  }
`;

export const REMOVE_CLINIC_MEMBER_MUTATION = gql`
  mutation RemoveClinicMember($clinicId: ID!, $membershipId: ID!) {
    removeClinicMember(clinicId: $clinicId, membershipId: $membershipId)
  }
`;

export const CLINIC_INVITATION_PREVIEW_QUERY = gql`
  query ClinicInvitationPreview($token: String!) {
    clinicInvitationPreview(token: $token) {
      state
      clinicName
      email
      role
      accountExists
    }
  }
`;

export const ACCEPT_CLINIC_INVITATION_MUTATION = gql`
  mutation AcceptClinicInvitation($token: String!) {
    acceptClinicInvitation(token: $token) {
      ...ClinicFields
    }
  }
  ${CLINIC_FIELDS}
`;
