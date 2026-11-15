import { gql } from '@apollo/client';

export const PATIENT_CLINIC_ACCESS_FIELDS = gql`
  fragment PatientClinicAccessFields on PatientClinicAccess {
    clinicId
    accessStatus
    grantedAt
  }
`;

export const PATIENT_OWNER_FIELDS = gql`
  fragment PatientOwnerFields on PatientOwner {
    id
    firstName
    lastName
    email
  }
`;

export const PATIENT_FIELDS = gql`
  fragment PatientFields on Patient {
    id
    name
    species
    breed
    gender
    dateOfBirth
    owner {
      ...PatientOwnerFields
    }
    clinicAccesses {
      ...PatientClinicAccessFields
    }
  }
  ${PATIENT_OWNER_FIELDS}
  ${PATIENT_CLINIC_ACCESS_FIELDS}
`;

export const MY_PATIENTS_QUERY = gql`
  query MyPatients {
    myPatients {
      ...PatientFields
    }
  }
  ${PATIENT_FIELDS}
`;

export const PATIENT_QUERY = gql`
  query Patient($id: ID!) {
    patient(id: $id) {
      ...PatientFields
    }
  }
  ${PATIENT_FIELDS}
`;

export const REGISTER_PATIENT_MUTATION = gql`
  mutation RegisterPatient($input: RegisterPatientInput!) {
    registerPatient(input: $input) {
      ...PatientFields
    }
  }
  ${PATIENT_FIELDS}
`;

export const UPDATE_PATIENT_MUTATION = gql`
  mutation UpdatePatient($id: ID!, $input: UpdatePatientInput!) {
    updatePatient(id: $id, input: $input) {
      ...PatientFields
    }
  }
  ${PATIENT_FIELDS}
`;

export const CLAIM_PATIENT_BY_SHARE_CODE_MUTATION = gql`
  mutation ClaimPatientByShareCode($input: ClaimPatientByShareCodeInput!) {
    claimPatientByShareCode(input: $input) {
      ...PatientFields
    }
  }
  ${PATIENT_FIELDS}
`;
