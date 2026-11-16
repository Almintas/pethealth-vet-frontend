import { describe, expect, it } from 'vitest';
import { isPlausibleMicrochip } from './graphql';

describe('isPlausibleMicrochip', () => {
  it('accepts chip numbers however they are typed', () => {
    expect(isPlausibleMicrochip('440 123 456 789 012')).toBe(true);
    expect(isPlausibleMicrochip('440-123-456-789-012')).toBe(true);
    expect(isPlausibleMicrochip('a1b2c3d4e5')).toBe(true);
  });

  it('rejects values that cannot be chip numbers', () => {
    expect(isPlausibleMicrochip('1234')).toBe(false);
    expect(isPlausibleMicrochip('4401234567890123')).toBe(false);
    expect(isPlausibleMicrochip('440 123 456 789 01#')).toBe(false);
  });
});
