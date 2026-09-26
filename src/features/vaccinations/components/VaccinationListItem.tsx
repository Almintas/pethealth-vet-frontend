import { useTranslation } from 'react-i18next';
import type { VetVaccination } from '../types';
import { formatVaccinationDate } from '../utils/vaccination-display';

type VaccinationListItemProps = {
  vaccination: VetVaccination;
  onView: (vaccination: VetVaccination) => void;
};

export function VaccinationListItem({ vaccination, onView }: VaccinationListItemProps) {
  const { t, i18n } = useTranslation();

  return (
    <article className="medical-history__item">
      <p className="medical-history__item-date">
        {formatVaccinationDate(vaccination.administeredAt, i18n.language)}
      </p>
      <p className="medical-history__item-title">{vaccination.vaccineName}</p>
      <p className="medical-history__item-preview">
        {t('vaccinations.administered')}:{' '}
        {formatVaccinationDate(vaccination.administeredAt, i18n.language)}
      </p>
      {vaccination.nextDueAt ? (
        <p className="medical-history__item-type">
          {t('vaccinations.nextDue')}:{' '}
          {formatVaccinationDate(vaccination.nextDueAt, i18n.language)}
        </p>
      ) : null}
      {vaccination.veterinarianName ? (
        <p className="medical-history__item-vet">{vaccination.veterinarianName}</p>
      ) : null}
      <button
        type="button"
        className="medical-history__item-action"
        onClick={() => onView(vaccination)}
      >
        {t('vaccinations.viewVaccination')}
      </button>
    </article>
  );
}
