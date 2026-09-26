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
      <p className="medical-history__item-title">{medication.name}</p>
      <p className="medical-history__item-preview">{formatDosageLine(medication)}</p>
      <p className="medical-history__item-date">
        {t('medications.started')}: {formatMedicationDate(medication.startDate, i18n.language)}
      </p>
      <p className="medical-history__item-type">
        {t('medications.status')}: {statusLabel}
      </p>
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
