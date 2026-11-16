import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
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

/** Local date `days` from today as yyyy-mm-dd (for date inputs). */
export function daysFromTodayIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Current 6-digit TOTP code for a base32 key (RFC 6238, SHA-1, 30 s). */
export function totpCode(base32Key: string, timeMs = Date.now()): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of base32Key.toUpperCase().replace(/[^A-Z2-7]/g, '')) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(timeMs / 30_000)));
  const digest = createHmac('sha1', Buffer.from(bytes)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(binary % 1_000_000).padStart(6, '0');
}
