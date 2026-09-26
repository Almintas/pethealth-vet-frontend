import { gql } from '@apollo/client';

export const VET_VACCINATION_FIELDS = gql`
  fragment VetVaccinationFields on VetVaccination {
    id
    petId
    vaccineName
    administeredAt
    nextDueAt
    veterinarianName
    clinicName
    batchNumber
    notes
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

export const PATIENT_VACCINATIONS_PAGE_QUERY = gql`
  ${VET_VACCINATION_FIELDS}
  query PatientVaccinationsPage($patientId: ID!, $query: PatientVaccinationsPageInput) {
    patientVaccinationsPage(patientId: $patientId, query: $query) {
      total
      page
      limit
      totalPages
      nextDueVaccineName
      nextDueAt
      items {
        ...VetVaccinationFields
      }
    }
  }
`;

export const CREATE_VET_VACCINATION_MUTATION = gql`
  ${VET_VACCINATION_FIELDS}
  mutation CreateVetVaccination($input: CreateVetVaccinationInput!) {
    createVetVaccination(input: $input) {
      ...VetVaccinationFields
    }
  }
`;

export const UPDATE_VET_VACCINATION_MUTATION = gql`
  ${VET_VACCINATION_FIELDS}
  mutation UpdateVetVaccination($id: ID!, $input: UpdateVetVaccinationInput!) {
    updateVetVaccination(id: $id, input: $input) {
      ...VetVaccinationFields
    }
  }
`;
