import { describe, expect, it } from 'vitest';
import { reminderDueAtFromDateInput, sortReminders, type VetPatientReminder } from './types';

const reminder = (id: string, dueAt: string, status = 'PENDING'): VetPatientReminder => ({
  id,
  petId: 'p1',
  type: 'GENERAL',
  title: id,
  dueAt,
  status,
  managedBy: 'CLINIC',
  createdAt: dueAt,
});

describe('owner reminder helpers', () => {
  it('turns a date input into 09:00 local time', () => {
    const iso = reminderDueAtFromDateInput('2026-12-10');
    expect(iso).not.toBeNull();
    const date = new Date(iso!);
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 11, 10, 9]);
    expect(reminderDueAtFromDateInput('')).toBeNull();
    expect(reminderDueAtFromDateInput('10/12/2026')).toBeNull();
  });

  it('lists waiting reminders soonest first, then finished ones newest first', () => {
    const sorted = sortReminders([
      reminder('done-old', '2026-01-01T09:00:00Z', 'COMPLETED'),
      reminder('later', '2026-12-20T09:00:00Z'),
      reminder('done-new', '2026-06-01T09:00:00Z', 'DISMISSED'),
      reminder('soon', '2026-12-01T09:00:00Z'),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['soon', 'later', 'done-new', 'done-old']);
  });
});
