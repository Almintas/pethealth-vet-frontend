import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DialogPortal } from '../../../components/feedback/DialogPortal';
import type { Patient } from '../../patients/types';
import {
  formatMedicalRecordDate,
  getMedicalRecordTypeKey,
} from '../utils/medical-record-display';
import type { VetMedicalRecord } from '../types';
import { MedicalRecordAttachments } from './MedicalRecordAttachments';
import '../../patients/components/patient-form-dialog.css';
import '../../patients/components/patient-profile.css';

type MedicalRecordDetailDialogProps = {
  record: VetMedicalRecord | null;
  patient: Patient;
  clinics: { id: string; name: string }[];
  onClose: () => void;
  onEdit: (record: VetMedicalRecord) => void;
  /** Called after files were added or removed. */
  onAttachmentsChanged?: () => void;
};

export function MedicalRecordDetailDialog({
  record,
  patient,
  clinics,
  onClose,
  onEdit,
  onAttachmentsChanged,
}: MedicalRecordDetailDialogProps) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!record) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [record]);

  if (!record) {
    return null;
  }

  const typeKey = getMedicalRecordTypeKey(record);

  return (
    <DialogPortal>
    <div className="patient-form-dialog__backdrop" role="presentation" onClick={onClose}>
      <div
        className="patient-form-dialog__panel patient-form-dialog__panel--wide"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="patient-form-dialog__header">
          <h2 className="patient-form-dialog__title">{t('medicalRecords.medicalRecord')}</h2>
          <button
            type="button"
            className="patient-form-dialog__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        <dl className="patient-profile__details">
          <div>
            <dt>{t('medicalRecords.recordDate')}</dt>
            <dd>{formatMedicalRecordDate(record.date, i18n.language)}</dd>
          </div>
          <div>
            <dt>{t('medicalRecords.recordType')}</dt>
            <dd>{t(`enums.medicalRecordType.${typeKey}`)}</dd>
          </div>
          <div>
            <dt>{t('medicalRecords.titleReason')}</dt>
            <dd>{record.title}</dd>
          </div>
          <div>
            <dt>{t('medicalRecords.patient')}</dt>
            <dd>{patient.name}</dd>
          </div>
          {record.diagnosis ? (
            <div>
              <dt>{t('medicalRecords.diagnosis')}</dt>
              <dd>{record.diagnosis}</dd>
            </div>
          ) : null}
          {record.notes ? (
            <div>
              <dt>{t('medicalRecords.notes')}</dt>
              <dd>{record.notes}</dd>
            </div>
          ) : null}
          {record.description ? (
            <div>
              <dt>{t('medicalRecords.treatment')}</dt>
              <dd>{record.description}</dd>
            </div>
          ) : null}
          {record.veterinarianName ? (
            <div>
              <dt>{t('medicalRecords.veterinarian')}</dt>
              <dd>{record.veterinarianName}</dd>
            </div>
          ) : null}
          {record.clinicName ? (
            <div>
              <dt>{t('patients.clinic')}</dt>
              <dd>{record.clinicName}</dd>
            </div>
          ) : null}
        </dl>

        <MedicalRecordAttachments
          key={record.id}
          record={record}
          patient={patient}
          clinics={clinics}
          onChanged={onAttachmentsChanged}
        />

        <div className="patient-form-dialog__actions">
          <button
            type="button"
            className="ph-button ph-button--secondary"
            onClick={onClose}
          >
            {t('common.close')}
          </button>
          <button
            type="button"
            className="ph-button ph-button--primary"
            onClick={() => onEdit(record)}
          >
            {t('medicalRecords.editMedicalRecord')}
          </button>
        </div>
      </div>
    </div>
    </DialogPortal>
  );
}
