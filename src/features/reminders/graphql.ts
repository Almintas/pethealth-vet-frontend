import { gql } from '@apollo/client';

export const VET_REMINDER_FIELDS = gql`
  fragment VetPatientReminderFields on VetPatientReminder {
    id
    petId
    type
    title
    message
    dueAt
    status
    managedBy
    clinicId
    clinicName
    createdByName
    createdAt
  }
`;

export const PATIENT_REMINDERS_QUERY = gql`
  ${VET_REMINDER_FIELDS}
  query PatientReminders($patientId: ID!) {
    patientReminders(patientId: $patientId) {
      ...VetPatientReminderFields
    }
  }
`;

export const CREATE_VET_REMINDER_MUTATION = gql`
  ${VET_REMINDER_FIELDS}
  mutation CreateVetReminder($input: CreateVetReminderInput!) {
    createVetReminder(input: $input) {
      ...VetPatientReminderFields
    }
  }
`;

export const DELETE_VET_REMINDER_MUTATION = gql`
  mutation DeleteVetReminder($id: ID!, $clinicId: ID!, $patientId: ID!) {
    deleteVetReminder(id: $id, clinicId: $clinicId, patientId: $patientId) {
      id
    }
  }
`;
