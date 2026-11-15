import type { Patient } from '../../patients/types';

const RECENT_PATIENT_LIMIT = 5;

function latestGrantedAt(patient: Patient): number {
  return patient.clinicAccesses.reduce((latest, access) => {
    const time = access.grantedAt ? new Date(access.grantedAt).getTime() : 0;
    return Number.isNaN(time) ? latest : Math.max(latest, time);
  }, 0);
}

/** Patients the clinic most recently gained access to. */
export function selectRecentPatients(patients: Patient[]): Patient[] {
  return [...patients]
    .sort((left, right) => latestGrantedAt(right) - latestGrantedAt(left))
    .slice(0, RECENT_PATIENT_LIMIT);
}
