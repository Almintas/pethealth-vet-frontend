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
    twoFactorEnabled
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
      twoFactorRequired
      twoFactorToken
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

export const VERIFY_TWO_FACTOR_LOGIN_MUTATION = gql`
  mutation VerifyTwoFactorLogin($input: VerifyTwoFactorLoginInput!) {
    verifyTwoFactorLogin(input: $input) {
      accessToken
    }
  }
`;

export const START_TWO_FACTOR_SETUP_MUTATION = gql`
  mutation StartTwoFactorSetup {
    startTwoFactorSetup {
      secret
      otpauthUrl
    }
  }
`;

export const CONFIRM_TWO_FACTOR_SETUP_MUTATION = gql`
  mutation ConfirmTwoFactorSetup($code: String!) {
    confirmTwoFactorSetup(code: $code) {
      recoveryCodes
    }
  }
`;

export const DISABLE_TWO_FACTOR_MUTATION = gql`
  mutation DisableTwoFactor($code: String!) {
    disableTwoFactor(code: $code)
  }
`;
