import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Patient } from '../../patients/types';
import {
  ATTACHMENT_ACCEPT,
  AttachmentError,
  downloadAttachment,
  formatFileSize,
  removeAttachment,
  uploadAttachment,
} from '../attachments.service';
import type { VetMedicalRecord, VetMedicalRecordAttachment } from '../types';
import { formatMedicalRecordDate } from '../utils/medical-record-display';
import './medical-record-attachments.css';

type MedicalRecordAttachmentsProps = {
  record: VetMedicalRecord;
  patient: Patient;
  clinics: { id: string; name: string }[];
  /** Called after a file was added or removed, to refresh the record list. */
  onChanged?: () => void;
};

/** Files on a medical record: list, download, attach and remove (own clinic). */
export function MedicalRecordAttachments({ record, patient, clinics, onChanged }: MedicalRecordAttachmentsProps) {
  const { t, i18n } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<VetMedicalRecordAttachment[]>(record.attachments ?? []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The user's clinics that can work with this patient; files are attached
  // on behalf of the first one, like new records.
  const accessibleClinicIds = new Set(patient.clinicAccesses.map((access) => access.clinicId));
  const myClinicIds = clinics.filter((clinic) => accessibleClinicIds.has(clinic.id)).map((clinic) => clinic.id);
  const uploadClinicId = myClinicIds[0] ?? null;

  const showError = (caught: unknown, fallback: string) => {
    setError(
      caught instanceof AttachmentError ? t(`medicalRecords.attachments.errors.${caught.key}`) : fallback,
    );
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || !uploadClinicId) {
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const created = await uploadAttachment(record.id, uploadClinicId, file);
      setAttachments((current) => [...current, created]);
      onChanged?.();
    } catch (caught) {
      showError(caught, t('medicalRecords.attachments.errors.uploadFailed'));
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (attachment: VetMedicalRecordAttachment) => {
    setError(null);
    setBusyId(attachment.id);
    try {
      await downloadAttachment(record.id, attachment);
    } catch (caught) {
      showError(caught, t('medicalRecords.attachments.errors.downloadFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (attachment: VetMedicalRecordAttachment) => {
    if (!attachment.clinicId || !window.confirm(t('medicalRecords.attachments.removeConfirm', { name: attachment.fileName }))) {
      return;
    }
    setError(null);
    setBusyId(attachment.id);
    try {
      await removeAttachment(record.id, attachment.id, attachment.clinicId);
      setAttachments((current) => current.filter((item) => item.id !== attachment.id));
      onChanged?.();
    } catch (caught) {
      showError(caught, t('medicalRecords.attachments.errors.removeFailed'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="record-attachments" aria-labelledby={`record-attachments-${record.id}`}>
      <div className="record-attachments__header">
        <h3 id={`record-attachments-${record.id}`} className="record-attachments__title">
          {t('medicalRecords.attachments.title')}
        </h3>
        {uploadClinicId ? (
          <label className="ph-button ph-button--secondary record-attachments__upload" aria-disabled={isUploading}>
            {isUploading ? t('medicalRecords.attachments.uploading') : t('medicalRecords.attachments.attach')}
            <input
              ref={inputRef}
              type="file"
              accept={ATTACHMENT_ACCEPT}
              className="record-attachments__input"
              disabled={isUploading}
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </label>
        ) : null}
      </div>
      <p className="record-attachments__hint">
        {uploadClinicId ? t('medicalRecords.attachments.hint') : t('medicalRecords.attachments.noClinic')}
      </p>

      {error ? (
        <p className="record-attachments__error" role="alert">
          {error}
        </p>
      ) : null}

      {attachments.length === 0 ? (
        <p className="record-attachments__empty">{t('medicalRecords.attachments.empty')}</p>
      ) : (
        <ul className="record-attachments__list">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="record-attachments__item">
              <div className="record-attachments__file">
                <span className="record-attachments__name">{attachment.fileName}</span>
                <span className="record-attachments__meta">
                  {[
                    formatFileSize(attachment.size, i18n.language),
                    attachment.clinicName,
                    attachment.uploadedByName,
                    formatMedicalRecordDate(attachment.createdAt, i18n.language),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              <div className="record-attachments__actions">
                <button
                  type="button"
                  className="ph-button ph-button--secondary"
                  onClick={() => void handleDownload(attachment)}
                  disabled={busyId === attachment.id}
                  aria-label={`${t('medicalRecords.attachments.download')}: ${attachment.fileName}`}
                >
                  {t('medicalRecords.attachments.download')}
                </button>
                {attachment.clinicId && myClinicIds.includes(attachment.clinicId) ? (
                  <button
                    type="button"
                    className="ph-button ph-button--secondary record-attachments__remove"
                    onClick={() => void handleRemove(attachment)}
                    disabled={busyId === attachment.id}
                    aria-label={`${t('medicalRecords.attachments.remove')}: ${attachment.fileName}`}
                  >
                    {t('medicalRecords.attachments.remove')}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
