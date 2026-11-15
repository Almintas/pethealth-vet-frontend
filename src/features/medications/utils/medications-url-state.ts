import { MEDICATIONS_PAGE_SIZE } from '../constants/medications-limits';
import type { PatientMedicationsPageQueryInput } from '../types';

export type MedicationStatusFilter = 'all' | 'active' | 'stopped';

export type MedicationsUrlState = {
  page: number;
  search: string;
  status: MedicationStatusFilter;
};

export function parseMedicationsUrlState(
  searchParams: URLSearchParams,
): MedicationsUrlState {
  const pageRaw = Number(searchParams.get('page') ?? '1');
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const search = searchParams.get('q')?.trim() ?? '';
  const statusParam = searchParams.get('status');
  const status: MedicationStatusFilter =
    statusParam === 'active' || statusParam === 'stopped' ? statusParam : 'all';

  return { page, search, status };
}

export function buildMedicationsSearchParams(
  state: MedicationsUrlState,
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page > 1) {
    params.set('page', String(state.page));
  }
  if (state.search) {
    params.set('q', state.search);
  }
  if (state.status !== 'all') {
    params.set('status', state.status);
  }
  return params;
}

export function toMedicationsPageQuery(
  state: MedicationsUrlState,
): PatientMedicationsPageQueryInput {
  const query: PatientMedicationsPageQueryInput = {
    page: state.page,
    limit: MEDICATIONS_PAGE_SIZE,
  };
  if (state.search) {
    query.search = state.search;
  }
  if (state.status === 'active') {
    query.isActive = true;
  }
  if (state.status === 'stopped') {
    query.isActive = false;
  }
  return query;
}
