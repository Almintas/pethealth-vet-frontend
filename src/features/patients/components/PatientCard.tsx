import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { Patient } from '../types';
import {
  formatPatientDateOfBirth,
  getOwnerFullName,
  getSpeciesBreedLine,
} from '../utils/patient-display';

type PatientCardProps = {
  patient: Patient;
  onEdit: (patient: Patient) => void;
};

export function PatientCard({ patient, onEdit }: PatientCardProps) {
  const { t, i18n } = useTranslation();
  const ownerName = getOwnerFullName(patient);
  const speciesLine = getSpeciesBreedLine(patient);
  const dateOfBirth = formatPatientDateOfBirth(
    patient.dateOfBirth,
    i18n.language,
  );
  const ownerEmail = patient.owner.email?.trim();

  return (
    <article className="ph-card ph-card--pad patient-card">
      <div className="patient-card__section">
        <p className="patient-card__section-label">{t('patients.cardPatient')}</p>
        <h2 className="patient-card__name">
          <Link className="patient-card__name-link" to={`/patients/${patient.id}`}>
            {patient.name}
          </Link>
        </h2>
        <p className="patient-card__species">{speciesLine}</p>

        <dl className="patient-card__meta">
          <div>
            <dt>{t('patients.gender')}</dt>
            <dd>{patient.gender?.trim() || t('common.notProvided')}</dd>
          </div>
          <div>
            <dt>{t('patients.dateOfBirth')}</dt>
            <dd>{dateOfBirth || t('common.notProvided')}</dd>
          </div>
        </dl>
      </div>

      <div className="patient-card__owner">
        <p className="patient-card__section-label">{t('patients.owner')}</p>
        <p className="patient-card__owner-name">{ownerName}</p>
        {ownerEmail ? (
          <p className="patient-card__owner-email">{ownerEmail}</p>
        ) : null}
      </div>

      <div className="patient-card__actions">
        <Link className="ph-link-button patient-card__view-link" to={`/patients/${patient.id}`}>
          {t('patients.viewPatientArrow')}
        </Link>
        <button
          type="button"
          className="ph-button ph-button--secondary patient-card__edit-button"
          onClick={() => onEdit(patient)}
        >
          {t('patients.editPatient')}
        </button>
      </div>
    </article>
  );
}
