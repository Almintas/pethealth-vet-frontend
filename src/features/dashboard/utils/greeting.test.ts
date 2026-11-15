import { describe, expect, it } from 'vitest';
import { getGreetingPeriod } from './greeting';

const at = (hour: number) => new Date(2026, 10, 14, hour, 30);

describe('getGreetingPeriod', () => {
  it.each([
    [4, 'evening'],
    [5, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [17, 'afternoon'],
    [18, 'evening'],
    [23, 'evening'],
  ] as const)('%i:30 is %s', (hour, period) => {
    expect(getGreetingPeriod(at(hour))).toBe(period);
  });
});
