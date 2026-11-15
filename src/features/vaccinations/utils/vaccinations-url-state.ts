import { VACCINATIONS_PAGE_SIZE } from '../constants/vaccinations-limits';
import type { PatientVaccinationsPageQueryInput } from '../types';

export type VaccinationsFilterMode = 'all' | 'upcoming';

export type VaccinationsUrlState = {
  page: number;
  search: string;
  filter: VaccinationsFilterMode;
  administeredFrom: string;
  administeredTo: string;
};

export function parseVaccinationsUrlState(
  searchParams: URLSearchParams,
): VaccinationsUrlState {
  const pageRaw = Number(searchParams.get('page') ?? '1');
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const search = searchParams.get('q')?.trim() ?? '';
  const filterParam = searchParams.get('filter');
  const filter: VaccinationsFilterMode =
    filterParam === 'upcoming' ? 'upcoming' : 'all';

  return {
    page,
    search,
    filter,
    administeredFrom: searchParams.get('from') ?? '',
    administeredTo: searchParams.get('to') ?? '',
  };
}

export function buildVaccinationsSearchParams(
  state: VaccinationsUrlState,
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page > 1) {
    params.set('page', String(state.page));
  }
  if (state.search) {
    params.set('q', state.search);
  }
  if (state.filter === 'upcoming') {
    params.set('filter', 'upcoming');
  }
  if (state.administeredFrom) {
    params.set('from', state.administeredFrom);
  }
  if (state.administeredTo) {
    params.set('to', state.administeredTo);
  }
  return params;
}

export function toVaccinationsPageQuery(
  state: VaccinationsUrlState,
): PatientVaccinationsPageQueryInput {
  const query: PatientVaccinationsPageQueryInput = {
    page: state.page,
    limit: VACCINATIONS_PAGE_SIZE,
  };
  if (state.search) {
    query.search = state.search;
  }
  if (state.filter === 'upcoming') {
    query.upcomingOnly = true;
  }
  if (state.administeredFrom) {
    query.administeredFrom = dateInputToIsoBoundary(state.administeredFrom, 'start');
  }
  if (state.administeredTo) {
    query.administeredTo = dateInputToIsoBoundary(state.administeredTo, 'end');
  }
  return query;
}

function dateInputToIsoBoundary(value: string, boundary: 'start' | 'end'): string {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    return value;
  }
  if (boundary === 'start') {
    return new Date(Date.UTC(year, month - 1, day)).toISOString();
  }
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString();
}
