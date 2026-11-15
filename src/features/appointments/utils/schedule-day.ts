import { endOfLocalDay, isSameLocalDay, startOfLocalDay } from './appointment-display';

export function datetimeLocalBoundsForScheduleDay(day: Date): {
  min: string;
  max: string;
} {
  const date = selectedDayIsoDate(day);
  return {
    min: `${date}T00:00`,
    max: `${date}T23:59`,
  };
}

export function datetimeLocalForScheduleDay(day: Date, now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const useNow = isSameLocalDay(day, now);
  const hours = useNow ? now.getHours() : 9;
  const minutes = useNow ? now.getMinutes() : 0;

  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}T${pad(hours)}:${pad(minutes)}`;
}

export function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function localDayRangeIso(day: Date): { scheduledFrom: string; scheduledTo: string } {
  const start = startOfLocalDay(day);
  const end = endOfLocalDay(day);
  return {
    scheduledFrom: start.toISOString(),
    scheduledTo: end.toISOString(),
  };
}

export function isToday(day: Date, now = new Date()): boolean {
  return (
    day.getFullYear() === now.getFullYear() &&
    day.getMonth() === now.getMonth() &&
    day.getDate() === now.getDate()
  );
}

export function isTomorrow(day: Date, now = new Date()): boolean {
  const tomorrow = addLocalDays(startOfLocalDay(now), 1);
  return (
    day.getFullYear() === tomorrow.getFullYear() &&
    day.getMonth() === tomorrow.getMonth() &&
    day.getDate() === tomorrow.getDate()
  );
}

export function formatSelectedDayHeading(day: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(day);
}

export function selectedDayIsoDate(day: Date): string {
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, '0');
  const date = String(day.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function formatScheduleDayTitle(
  day: Date,
  locale: string,
  labels: { today: string; tomorrow: string },
): string {
  if (isToday(day)) {
    return labels.today;
  }
  if (isTomorrow(day)) {
    return labels.tomorrow;
  }
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(day);
}
