import {
  normalizeMedicalRecordTypeValue,
  type MedicalRecordTypeValue,
} from '../constants/medical-record-types';
import type { VetMedicalRecord } from '../types';

export function formatMedicalRecordDate(
  isoDate: string,
  locale: string,
): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getMedicalRecordTypeKey(record: VetMedicalRecord): MedicalRecordTypeValue {
  return normalizeMedicalRecordTypeValue(record.type);
}

export function getMedicalRecordPreviewText(record: VetMedicalRecord): string {
  const parts = [record.notes, record.description, record.diagnosis]
    .map((value) => value?.trim())
    .filter(Boolean);
  const text = parts[0] ?? '';
  if (text.length <= 160) {
    return text;
  }
  return `${text.slice(0, 157)}…`;
}

export function isoDateToInputValue(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateInputToIso(dateInput: string): string {
  return new Date(`${dateInput}T00:00:00`).toISOString();
}
