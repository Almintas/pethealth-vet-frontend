import { useMutation } from '@apollo/client/react';
import { CREATE_CLINIC_MUTATION, MY_CLINICS_QUERY } from '../graphql';
import type {
  CreateClinicInput,
  CreateClinicMutationResult,
} from '../types';

export function useCreateClinic() {
  const [mutate, state] = useMutation<CreateClinicMutationResult>(
    CREATE_CLINIC_MUTATION,
    {
      refetchQueries: [{ query: MY_CLINICS_QUERY }],
      awaitRefetchQueries: true,
    },
  );

  const createClinic = async (input: CreateClinicInput) => {
    const { data } = await mutate({
      variables: {
        input: {
          name: input.name,
          ...(input.email ? { email: input.email } : {}),
          ...(input.phone ? { phone: input.phone } : {}),
          ...(input.address ? { address: input.address } : {}),
        },
      },
    });

    if (!data?.createClinic) {
      throw new Error('Failed to create clinic.');
    }

    return data.createClinic;
  };

  return {
    createClinic,
    loading: state.loading,
  };
}
