export const MEDICAL_RECORD_TYPE_OPTIONS = [
  { value: 'GENERAL_EXAMINATION' },
  { value: 'VACCINATION' },
  { value: 'ILLNESS' },
  { value: 'FOLLOW_UP' },
  { value: 'SURGERY' },
  { value: 'DENTAL' },
  { value: 'EMERGENCY' },
  { value: 'LAB_RESULTS' },
  { value: 'OTHER' },
] as const;

export type MedicalRecordTypeValue =
  (typeof MEDICAL_RECORD_TYPE_OPTIONS)[number]['value'];

export const DEFAULT_MEDICAL_RECORD_TYPE: MedicalRecordTypeValue =
  'GENERAL_EXAMINATION';

export function normalizeMedicalRecordTypeValue(
  raw: string,
): MedicalRecordTypeValue {
  const normalized = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const match = MEDICAL_RECORD_TYPE_OPTIONS.find(
    (option) => option.value === normalized,
  );
  return match?.value ?? 'OTHER';
}
