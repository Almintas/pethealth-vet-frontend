import type { VetMedication } from '../types';

export function formatMedicationDate(
  isoDate: string,
  locale: string,
): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isoDateToInputValue(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

export function dateInputToIso(dateInput: string): string {
  const [year, month, day] = dateInput.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    return dateInput;
  }
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

export function formatDosageLine(medication: VetMedication): string {
  return `${medication.dosage} ${medication.dosageUnit} · ${medication.frequency}`;
}

export function todayDateInputValue(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}
