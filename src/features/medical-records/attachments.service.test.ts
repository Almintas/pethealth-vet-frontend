import { describe, expect, it } from 'vitest';
import {
  ATTACHMENT_MAX_BYTES,
  apiBaseUrl,
  attachmentErrorKey,
  formatFileSize,
  validateAttachmentFile,
} from './attachments.service';

describe('attachments service helpers', () => {
  it('derives the REST base from the GraphQL URL', () => {
    expect(apiBaseUrl('https://vet.example.com/graphql')).toBe('https://vet.example.com');
    expect(apiBaseUrl('http://localhost:3001/graphql/')).toBe('http://localhost:3001');
  });

  it('formats file sizes', () => {
    expect(formatFileSize(512, 'en')).toBe('512 B');
    expect(formatFileSize(2048, 'en')).toBe('2 KB');
    expect(formatFileSize(1.5 * 1024 * 1024, 'en')).toBe('1.5 MB');
    expect(formatFileSize(1.5 * 1024 * 1024, 'lt')).toBe('1,5 MB');
  });

  it('checks size and type before uploading', () => {
    expect(validateAttachmentFile({ name: 'xray.pdf', size: 100, type: 'application/pdf' })).toBeNull();
    expect(validateAttachmentFile({ name: 'scan.JPG', size: 100, type: '' })).toBeNull();
    expect(validateAttachmentFile({ name: 'notes.docx', size: 100, type: 'application/msword' })).toBe('wrongType');
    expect(
      validateAttachmentFile({ name: 'big.pdf', size: ATTACHMENT_MAX_BYTES + 1, type: 'application/pdf' }),
    ).toBe('tooLarge');
  });

  it('turns API refusals into message keys', () => {
    expect(attachmentErrorKey(413, 'File too large', 'uploadFailed')).toBe('tooLarge');
    expect(attachmentErrorKey(400, 'Only PDF, JPG, PNG or WebP files can be attached.', 'uploadFailed')).toBe(
      'wrongType',
    );
    expect(attachmentErrorKey(400, 'A medical record can have at most 20 files.', 'uploadFailed')).toBe(
      'limitReached',
    );
    expect(attachmentErrorKey(403, 'Only the clinic that attached this file can remove it.', 'removeFailed')).toBe(
      'otherClinic',
    );
    expect(attachmentErrorKey(503, undefined, 'downloadFailed')).toBe('downloadFailed');
  });
});
