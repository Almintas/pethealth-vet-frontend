export type GreetingPeriod = 'morning' | 'afternoon' | 'evening';

/** Morning 05:00–11:59, afternoon 12:00–17:59, evening otherwise. */
export function getGreetingPeriod(date: Date = new Date()): GreetingPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 18) {
    return 'afternoon';
  }
  return 'evening';
}
