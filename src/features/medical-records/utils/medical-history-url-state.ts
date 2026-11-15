import { MEDICAL_HISTORY_PAGE_SIZE } from '../constants/medical-history-limits';

export type MedicalHistoryUrlState = {
  page: number;
  search: string;
  type: string;
  dateFrom: string;
  dateTo: string;
};

export function parseMedicalHistoryUrlState(
  searchParams: URLSearchParams,
): MedicalHistoryUrlState {
  const pageRaw = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return {
    page,
    search: searchParams.get('search')?.trim() ?? '',
    type: searchParams.get('type')?.trim() ?? '',
    dateFrom: searchParams.get('dateFrom')?.trim() ?? '',
    dateTo: searchParams.get('dateTo')?.trim() ?? '',
  };
}

export function buildMedicalHistorySearchParams(
  state: MedicalHistoryUrlState,
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page > 1) {
    params.set('page', String(state.page));
  }
  if (state.search) {
    params.set('search', state.search);
  }
  if (state.type) {
    params.set('type', state.type);
  }
  if (state.dateFrom) {
    params.set('dateFrom', state.dateFrom);
  }
  if (state.dateTo) {
    params.set('dateTo', state.dateTo);
  }
  return params;
}

export function toMedicalRecordsPageQuery(state: MedicalHistoryUrlState) {
  return {
    page: state.page,
    limit: MEDICAL_HISTORY_PAGE_SIZE,
    search: state.search.trim() || undefined,
    type: state.type || undefined,
    dateFrom: state.dateFrom ? dateInputToRangeStart(state.dateFrom) : undefined,
    dateTo: state.dateTo ? dateInputToRangeEnd(state.dateTo) : undefined,
  };
}

function dateInputToRangeStart(dateInput: string): string {
  return new Date(`${dateInput}T00:00:00`).toISOString();
}

function dateInputToRangeEnd(dateInput: string): string {
  return new Date(`${dateInput}T23:59:59.999`).toISOString();
}
