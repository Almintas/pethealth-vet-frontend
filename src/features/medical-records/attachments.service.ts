import { getAccessToken } from '../auth/token-storage';
import type { VetMedicalRecordAttachment } from './types';

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = /\.(pdf|jpe?g|png|webp)$/i;

/** Translation key (medicalRecords.attachments.*) for a failed action. */
export type AttachmentErrorKey =
  | 'tooLarge'
  | 'wrongType'
  | 'limitReached'
  | 'otherClinic'
  | 'uploadFailed'
  | 'downloadFailed'
  | 'removeFailed';

export class AttachmentError extends Error {
  readonly key: AttachmentErrorKey;

  constructor(key: AttachmentErrorKey) {
    super(key);
    this.key = key;
  }
}

/** REST base of the clinic API: VITE_GRAPHQL_URL without /graphql. */
export function apiBaseUrl(graphqlUrl = import.meta.env.VITE_GRAPHQL_URL ?? ''): string {
  return graphqlUrl.replace(/\/graphql\/?$/, '');
}

export function formatFileSize(bytes: number, language: string): string {
  const locale = language === 'lt' ? 'lt-LT' : 'en-US';
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(kb)} KB`;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(kb / 1024)} MB`;
}

/** Checks size and type before uploading, so the user gets a quick answer. */
export function validateAttachmentFile(file: Pick<File, 'name' | 'size' | 'type'>): AttachmentErrorKey | null {
  if (file.size > ATTACHMENT_MAX_BYTES) {
    return 'tooLarge';
  }
  if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.test(file.name)) {
    return 'wrongType';
  }
  return null;
}

/** Maps an API refusal to a translated message key. */
export function attachmentErrorKey(
  status: number,
  message: string | undefined,
  fallback: AttachmentErrorKey,
): AttachmentErrorKey {
  if (status === 413 || /10 MB/.test(message ?? '')) {
    return 'tooLarge';
  }
  if (status === 400 && /PDF/.test(message ?? '')) {
    return 'wrongType';
  }
  if (status === 400 && /at most/i.test(message ?? '')) {
    return 'limitReached';
  }
  if (status === 403 && /clinic that attached/i.test(message ?? '')) {
    return 'otherClinic';
  }
  return fallback;
}

async function call(path: string, init: RequestInit, fallback: AttachmentErrorKey): Promise<Response> {
  const token = getAccessToken();
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}) },
    });
  } catch {
    throw new AttachmentError(fallback);
  }
  if (response.ok) {
    return response;
  }
  let message: string | undefined;
  try {
    const body = (await response.json()) as { message?: string | string[] };
    message = Array.isArray(body.message) ? body.message.join(' ') : body.message;
  } catch {
    message = undefined;
  }
  throw new AttachmentError(attachmentErrorKey(response.status, message, fallback));
}

function attachmentPath(recordId: string, attachmentId?: string): string {
  const base = `/medical-records/${encodeURIComponent(recordId)}/attachments`;
  return attachmentId ? `${base}/${encodeURIComponent(attachmentId)}` : base;
}

export async function uploadAttachment(
  recordId: string,
  clinicId: string,
  file: File,
): Promise<VetMedicalRecordAttachment> {
  const invalid = validateAttachmentFile(file);
  if (invalid) {
    throw new AttachmentError(invalid);
  }
  const form = new FormData();
  form.append('clinicId', clinicId);
  form.append('file', file, file.name);
  const response = await call(attachmentPath(recordId), { method: 'POST', body: form }, 'uploadFailed');
  return (await response.json()) as VetMedicalRecordAttachment;
}

export async function removeAttachment(recordId: string, attachmentId: string, clinicId: string): Promise<void> {
  await call(
    `${attachmentPath(recordId, attachmentId)}?clinicId=${encodeURIComponent(clinicId)}`,
    { method: 'DELETE' },
    'removeFailed',
  );
}

/** Downloads the file with the user's token and saves it under its name. */
export async function downloadAttachment(recordId: string, attachment: VetMedicalRecordAttachment): Promise<void> {
  const response = await call(attachmentPath(recordId, attachment.id), { method: 'GET' }, 'downloadFailed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
