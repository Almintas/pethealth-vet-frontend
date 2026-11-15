import { gql } from '@apollo/client';

export const VETERINARIAN_PROFILE_FIELDS = gql`
  fragment VeterinarianProfileFields on VeterinarianProfile {
    id
    firstName
    lastName
    licenseNumber
  }
`;

export const AUTH_USER_FIELDS = gql`
  fragment AuthUserFields on User {
    id
    email
    role
    approvalStatus
    veterinarianProfile {
      ...VeterinarianProfileFields
    }
  }
  ${VETERINARIAN_PROFILE_FIELDS}
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        ...AuthUserFields
      }
    }
  }
  ${AUTH_USER_FIELDS}
`;

export const REGISTER_VETERINARIAN_MUTATION = gql`
  mutation RegisterVeterinarian($input: RegisterVeterinarianInput!) {
    registerVeterinarian(input: $input) {
      accessToken
      user {
        ...AuthUserFields
      }
    }
  }
  ${AUTH_USER_FIELDS}
`;

export const ME_QUERY = gql`
  query Me {
    me {
      ...AuthUserFields
    }
  }
  ${AUTH_USER_FIELDS}
`;

export const REGISTER_WITH_INVITATION_MUTATION = gql`
  mutation RegisterWithInvitation($input: RegisterWithInvitationInput!) {
    registerWithInvitation(input: $input) {
      accessToken
    }
  }
`;
