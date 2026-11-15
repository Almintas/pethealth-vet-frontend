import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DialogPortal } from '../../../components/feedback/DialogPortal';
import type { Patient } from '../../patients/types';
import type { VetVaccination } from '../types';
import { formatVaccinationDate } from '../utils/vaccination-display';
import '../../patients/components/patient-form-dialog.css';
import '../../patients/components/patient-profile.css';

type VaccinationDetailDialogProps = {
  vaccination: VetVaccination | null;
  patient: Patient;
  onClose: () => void;
  onEdit: (vaccination: VetVaccination) => void;
};

export function VaccinationDetailDialog({
  vaccination,
  patient,
  onClose,
  onEdit,
}: VaccinationDetailDialogProps) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!vaccination) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [vaccination]);

  if (!vaccination) {
    return null;
  }

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
            <h2 className="patient-form-dialog__title">{vaccination.vaccineName}</h2>
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
              <dt>{t('vaccinations.dateAdministered')}</dt>
              <dd>{formatVaccinationDate(vaccination.administeredAt, i18n.language)}</dd>
            </div>
            {vaccination.nextDueAt ? (
              <div>
                <dt>{t('vaccinations.nextDueDate')}</dt>
                <dd>{formatVaccinationDate(vaccination.nextDueAt, i18n.language)}</dd>
              </div>
            ) : null}
            <div>
              <dt>{t('vaccinations.patient')}</dt>
              <dd>{patient.name}</dd>
            </div>
            {vaccination.batchNumber ? (
              <div>
                <dt>{t('vaccinations.batchNumber')}</dt>
                <dd>{vaccination.batchNumber}</dd>
              </div>
            ) : null}
            {vaccination.veterinarianName ? (
              <div>
                <dt>{t('vaccinations.veterinarian')}</dt>
                <dd>{vaccination.veterinarianName}</dd>
              </div>
            ) : null}
            {vaccination.clinicName ? (
              <div>
                <dt>{t('patients.clinic')}</dt>
                <dd>{vaccination.clinicName}</dd>
              </div>
            ) : null}
            {vaccination.notes ? (
              <div>
                <dt>{t('vaccinations.notes')}</dt>
                <dd>{vaccination.notes}</dd>
              </div>
            ) : null}
          </dl>

          <div className="patient-form-dialog__actions">
            <button
              type="button"
              className="ph-button ph-button--primary"
              onClick={() => onEdit(vaccination)}
            >
              {t('vaccinations.editVaccination')}
            </button>
          </div>
        </div>
      </div>
    </DialogPortal>
  );
}
