import { gql } from '@apollo/client';

export const CLINIC_FIELDS = gql`
  fragment ClinicFields on ClinicModel {
    id
    name
    email
    phone
    address
  }
`;

export const MY_CLINICS_QUERY = gql`
  query MyClinics {
    myClinics {
      id
      status
      clinic {
        ...ClinicFields
      }
    }
  }
  ${CLINIC_FIELDS}
`;

export const CREATE_CLINIC_MUTATION = gql`
  mutation CreateClinic($input: CreateClinicInput!) {
    createClinic(input: $input) {
      ...ClinicFields
    }
  }
  ${CLINIC_FIELDS}
`;
