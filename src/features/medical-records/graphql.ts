import { gql } from '@apollo/client';

export const VET_MEDICAL_RECORD_FIELDS = gql`
  fragment VetMedicalRecordFields on VetMedicalRecord {
    id
    petId
    date
    type
    title
    description
    diagnosis
    veterinarianName
    clinicName
    notes
    attachments {
      id
      fileName
      contentType
      size
      clinicId
      clinicName
      uploadedByName
      createdAt
    }
    patient {
      id
      name
      species
      breed
      ownerFirstName
      ownerLastName
      ownerEmail
    }
  }
`;

export const PATIENT_MEDICAL_RECORDS_PAGE_QUERY = gql`
  ${VET_MEDICAL_RECORD_FIELDS}
  query PatientMedicalRecordsPage($patientId: ID!, $query: PatientMedicalRecordsPageInput) {
    patientMedicalRecordsPage(patientId: $patientId, query: $query) {
      total
      page
      limit
      totalPages
      items {
        ...VetMedicalRecordFields
      }
    }
  }
`;

export const VET_MEDICAL_RECORD_QUERY = gql`
  ${VET_MEDICAL_RECORD_FIELDS}
  query VetMedicalRecord($id: ID!) {
    vetMedicalRecord(id: $id) {
      ...VetMedicalRecordFields
    }
  }
`;

export const CREATE_VET_MEDICAL_RECORD_MUTATION = gql`
  ${VET_MEDICAL_RECORD_FIELDS}
  mutation CreateVetMedicalRecord($input: CreateVetMedicalRecordInput!) {
    createVetMedicalRecord(input: $input) {
      ...VetMedicalRecordFields
    }
  }
`;

export const UPDATE_VET_MEDICAL_RECORD_MUTATION = gql`
  ${VET_MEDICAL_RECORD_FIELDS}
  mutation UpdateVetMedicalRecord($id: ID!, $input: UpdateVetMedicalRecordInput!) {
    updateVetMedicalRecord(id: $id, input: $input) {
      ...VetMedicalRecordFields
    }
  }
`;
