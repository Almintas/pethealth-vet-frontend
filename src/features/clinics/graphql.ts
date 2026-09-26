import { gql } from '@apollo/client';

export const CLINIC_FIELDS = gql`
  fragment ClinicFields on Clinic {
    id
    name
    email
    phone
    address
    createdAt
    updatedAt
  }
`;

export const MY_CLINICS_QUERY = gql`
  query MyClinics {
    myClinics {
      ...ClinicFields
    }
  }
  ${CLINIC_FIELDS}
`;
