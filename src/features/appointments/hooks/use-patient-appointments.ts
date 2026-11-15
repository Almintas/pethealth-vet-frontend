import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { MY_APPOINTMENTS_QUERY, PATIENT_APPOINTMENTS_QUERY } from '../graphql';
import type {
  AppointmentsScheduleQueryInput,
  MyAppointmentsQueryResult,
  PatientAppointmentsQueryResult,
  VetAppointment,
} from '../types';

type UsePatientAppointmentsOptions = {
  patientId: string;
  scheduleQuery?: AppointmentsScheduleQueryInput;
  skip?: boolean;
};

type UsePatientAppointmentsResult = {
  appointments: VetAppointment[];
  loading: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
};

export function usePatientAppointments({
  patientId,
  scheduleQuery,
  skip = false,
}: UsePatientAppointmentsOptions): UsePatientAppointmentsResult {
  const {
    data: patientData,
    loading: patientLoading,
    error: patientError,
    refetch: refetchPatient,
  } = useQuery<PatientAppointmentsQueryResult>(PATIENT_APPOINTMENTS_QUERY, {
    variables: { patientId, query: scheduleQuery },
    skip,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const useFallback = Boolean(patientError);

  const {
    data: myData,
    loading: myLoading,
    error: myError,
    refetch: refetchMy,
  } = useQuery<MyAppointmentsQueryResult>(MY_APPOINTMENTS_QUERY, {
    variables: scheduleQuery ? { query: scheduleQuery } : undefined,
    skip: skip || !useFallback,
    fetchPolicy: 'cache-and-network',
  });

  const appointments = useMemo(() => {
    if (!useFallback) {
      return patientData?.patientAppointments ?? [];
    }
    const mine = myData?.myAppointments ?? [];
    return mine.filter((appointment) => appointment.petId === patientId);
  }, [useFallback, patientData?.patientAppointments, myData?.myAppointments, patientId]);

  const loading = useFallback
    ? myLoading && !myData
    : patientLoading && patientData === undefined;
  const error = useFallback ? myError : patientError;

  const refetch = async () => {
    if (useFallback) {
      return refetchMy();
    }
    return refetchPatient();
  };

  return { appointments, loading, error, refetch };
}
