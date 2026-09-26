import { gql } from '@apollo/client';

export const APPOINTMENT_PATIENT_FIELDS = gql`
  fragment AppointmentPatientFields on AppointmentPatientSummary {
    id
    name
    species
    breed
    ownerFirstName
    ownerLastName
    ownerEmail
  }
`;

export const VET_APPOINTMENT_FIELDS = gql`
  fragment VetAppointmentFields on VetAppointment {
    id
    petId
    scheduledAt
    type
    status
    reason
    notes
    clinicName
    veterinarianName
    clinicId
    patient {
      ...AppointmentPatientFields
    }
  }
  ${APPOINTMENT_PATIENT_FIELDS}
`;

export const MY_APPOINTMENTS_QUERY = gql`
  query MyAppointments {
    myAppointments {
      ...VetAppointmentFields
    }
  }
  ${VET_APPOINTMENT_FIELDS}
`;

export const CREATE_VET_APPOINTMENT_MUTATION = gql`
  mutation CreateVetAppointment($input: CreateVetAppointmentInput!) {
    createVetAppointment(input: $input) {
      ...VetAppointmentFields
    }
  }
  ${VET_APPOINTMENT_FIELDS}
`;

export const UPDATE_VET_APPOINTMENT_MUTATION = gql`
  mutation UpdateVetAppointment($id: ID!, $input: UpdateVetAppointmentInput!) {
    updateVetAppointment(id: $id, input: $input) {
      ...VetAppointmentFields
    }
  }
  ${VET_APPOINTMENT_FIELDS}
`;

export const CANCEL_VET_APPOINTMENT_MUTATION = gql`
  mutation CancelVetAppointment($id: ID!) {
    cancelVetAppointment(id: $id) {
      ...VetAppointmentFields
    }
  }
  ${VET_APPOINTMENT_FIELDS}
`;
