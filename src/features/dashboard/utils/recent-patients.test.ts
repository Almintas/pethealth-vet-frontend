import { describe, expect, it } from 'vitest';
import type { Patient } from '../../patients/types';
import { selectRecentPatients } from './recent-patients';

function patient(id: string, grantedAt: (string | null)[]): Patient {
  return {
    id,
    name: id,
    species: 'Cat',
    owner: { id: 'o', firstName: 'A', lastName: 'B', email: 'a@b.lt' },
    clinicAccesses: grantedAt.map((date) => ({
      clinicId: 'c',
      accessStatus: 'ACTIVE',
      grantedAt: date,
    })),
  } as Patient;
}

describe('selectRecentPatients', () => {
  it('orders by the most recent access grant and keeps five', () => {
    const patients = [
      patient('old', ['2026-01-01T00:00:00Z']),
      patient('newest', ['2026-03-01T00:00:00Z', '2026-11-01T00:00:00Z']),
      patient('none', [null]),
      patient('mid', ['2026-06-01T00:00:00Z']),
      patient('a', ['2026-02-01T00:00:00Z']),
      patient('b', ['2026-02-02T00:00:00Z']),
    ];
    expect(selectRecentPatients(patients).map((p) => p.id)).toEqual([
      'newest',
      'mid',
      'b',
      'a',
      'old',
    ]);
  });
});
