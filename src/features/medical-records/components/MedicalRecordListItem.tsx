import { useTranslation } from 'react-i18next';
import type { VetMedicalRecord } from '../types';
import {
  formatMedicalRecordDate,
  getMedicalRecordPreviewText,
  getMedicalRecordTypeKey,
} from '../utils/medical-record-display';

type MedicalRecordListItemProps = {
  record: VetMedicalRecord;
  onView: (record: VetMedicalRecord) => void;
};

export function MedicalRecordListItem({ record, onView }: MedicalRecordListItemProps) {
  const { t, i18n } = useTranslation();
  const typeKey = getMedicalRecordTypeKey(record);
  const preview = getMedicalRecordPreviewText(record);

  return (
    <article className="medical-history__item">
      <p className="medical-history__item-date">
        {formatMedicalRecordDate(record.date, i18n.language)}
      </p>
      <p className="medical-history__item-type">
        {t(`enums.medicalRecordType.${typeKey}`)}
      </p>
      {record.title ? (
        <p className="medical-history__item-title">{record.title}</p>
      ) : null}
      {preview ? <p className="medical-history__item-preview">{preview}</p> : null}
      {record.veterinarianName ? (
        <p className="medical-history__item-vet">{record.veterinarianName}</p>
      ) : null}
      <button
        type="button"
        className="medical-history__item-action"
        onClick={() => onView(record)}
      >
        {t('medicalRecords.viewRecord')}
      </button>
    </article>
  );
}
