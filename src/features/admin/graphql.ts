import { gql } from '@apollo/client';

export const ADMIN_VETERINARIAN_FIELDS = gql`
  fragment AdminVeterinarianFields on AdminVeterinarian {
    userId
    email
    role
    approvalStatus
    firstName
    lastName
    licenseNumber
    registeredAt
  }
`;

export const ADMIN_VETERINARIANS_QUERY = gql`
  query AdminVeterinarians($status: AccountApprovalStatus) {
    adminVeterinarians(status: $status) {
      ...AdminVeterinarianFields
    }
  }
  ${ADMIN_VETERINARIAN_FIELDS}
`;

export const APPROVE_VETERINARIAN_MUTATION = gql`
  mutation ApproveVeterinarian($userId: ID!) {
    approveVeterinarian(userId: $userId) {
      ...AdminVeterinarianFields
    }
  }
  ${ADMIN_VETERINARIAN_FIELDS}
`;

export const REJECT_VETERINARIAN_MUTATION = gql`
  mutation RejectVeterinarian($userId: ID!) {
    rejectVeterinarian(userId: $userId) {
      ...AdminVeterinarianFields
    }
  }
  ${ADMIN_VETERINARIAN_FIELDS}
`;
