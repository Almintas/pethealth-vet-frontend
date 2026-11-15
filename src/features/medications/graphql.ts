import { gql } from '@apollo/client';

export const VET_MEDICATION_FIELDS = gql`
  fragment VetMedicationFields on VetMedication {
    id
    petId
    name
    dosage
    dosageUnit
    frequency
    startDate
    endDate
    veterinarianName
    clinicName
    notes
    isActive
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

export const PATIENT_MEDICATIONS_PAGE_QUERY = gql`
  ${VET_MEDICATION_FIELDS}
  query PatientMedicationsPage($patientId: ID!, $query: PatientMedicationsPageInput) {
    patientMedicationsPage(patientId: $patientId, query: $query) {
      total
      page
      limit
      totalPages
      activeTotal
      items {
        ...VetMedicationFields
      }
    }
  }
`;

export const VET_MEDICATION_QUERY = gql`
  ${VET_MEDICATION_FIELDS}
  query VetMedication($id: ID!) {
    vetMedication(id: $id) {
      ...VetMedicationFields
    }
  }
`;

export const CREATE_VET_MEDICATION_MUTATION = gql`
  ${VET_MEDICATION_FIELDS}
  mutation CreateVetMedication($input: CreateVetMedicationInput!) {
    createVetMedication(input: $input) {
      ...VetMedicationFields
    }
  }
`;

export const UPDATE_VET_MEDICATION_MUTATION = gql`
  ${VET_MEDICATION_FIELDS}
  mutation UpdateVetMedication($id: ID!, $input: UpdateVetMedicationInput!) {
    updateVetMedication(id: $id, input: $input) {
      ...VetMedicationFields
    }
  }
`;
