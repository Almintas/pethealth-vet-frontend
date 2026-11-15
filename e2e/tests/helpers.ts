import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import type { Page } from '@playwright/test';

export const OWNER_APP = process.env.OWNER_APP_URL ?? 'http://localhost:5173';
export const VET_APP = process.env.VET_APP_URL ?? 'http://localhost:5174';
export const PASSWORD = 'E2e-Password-123';
export const RUN = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

/** Approves a vet account the way an operator would (scripts/approve-veterinarian.mjs). */
export function approveVet(email: string): void {
  const vetBackendDir = process.env.VET_BACKEND_DIR;
  if (!vetBackendDir) {
    throw new Error('Set VET_BACKEND_DIR to a pethealth-vet-backend checkout');
  }
  execFileSync(
    process.execPath,
    [join(vetBackendDir, 'scripts/approve-veterinarian.mjs'), email],
    { env: process.env, stdio: 'pipe' },
  );
}

/** Accept every window.confirm() the app shows (revoke, remove, …). */
export function acceptDialogs(page: Page): void {
  page.on('dialog', (dialog) => void dialog.accept());
}

export function todayIso(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
