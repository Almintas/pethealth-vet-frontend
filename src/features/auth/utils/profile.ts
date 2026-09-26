import type { AuthUser } from '../types';

export function getVeterinarianFirstName(user: AuthUser | null): string {
  return user?.veterinarianProfile?.firstName?.trim() ?? '';
}

export function getVeterinarianLastName(user: AuthUser | null): string {
  return user?.veterinarianProfile?.lastName?.trim() ?? '';
}

export function getVeterinarianDisplayName(user: AuthUser | null): string {
  const fullName = [
    getVeterinarianFirstName(user),
    getVeterinarianLastName(user),
  ]
    .filter(Boolean)
    .join(' ');
  return fullName || user?.email || '';
}

export function getVeterinarianInitials(user: AuthUser | null): string {
  const first = getVeterinarianFirstName(user).charAt(0);
  const last = getVeterinarianLastName(user).charAt(0);
  const initials = `${first}${last}`.trim();
  return initials || 'V';
}
