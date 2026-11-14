import { useTranslation } from 'react-i18next';
import type { VetMedication } from '../types';
import {
  formatDosageLine,
  formatMedicationDate,
} from '../utils/medication-display';

type MedicationListItemProps = {
  medication: VetMedication;
  onView: (medication: VetMedication) => void;
};

export function MedicationListItem({ medication, onView }: MedicationListItemProps) {
  const { t, i18n } = useTranslation();

  const statusLabel = medication.isActive
    ? t('medications.statusActive')
    : t('medications.statusStopped');

  return (
    <article className="medical-history__item">
      <p className="medical-history__item-date">
        {t('medications.started')}: {formatMedicationDate(medication.startDate, i18n.language)}
      </p>
      <div className="medical-history__item-heading">
        <p className="medical-history__item-type">{medication.name}</p>
        <span
          className={medication.isActive ? 'ph-badge ph-badge--success' : 'ph-badge'}
          aria-label={`${t('medications.status')}: ${statusLabel}`}
        >
          {statusLabel}
        </span>
      </div>
      <p className="medical-history__item-preview">{formatDosageLine(medication)}</p>
      {medication.veterinarianName ? (
        <p className="medical-history__item-vet">{medication.veterinarianName}</p>
      ) : null}
      <button
        type="button"
        className="medical-history__item-action"
        onClick={() => onView(medication)}
      >
        {t('medications.viewMedication')}
      </button>
    </article>
  );
}
