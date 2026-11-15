import { useApolloClient, useMutation } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DialogPortal } from '../../../components/feedback/DialogPortal';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import type { Patient } from '../../patients/types';
import { UPDATE_VET_MEDICATION_MUTATION } from '../graphql';
import type { VetMedication } from '../types';
import {
  dateInputToIso,
  formatDosageLine,
  formatMedicationDate,
  todayDateInputValue,
} from '../utils/medication-display';
import '../../patients/components/patient-form-dialog.css';
import '../../patients/components/patient-profile.css';

type MedicationDetailDialogProps = {
  medication: VetMedication | null;
  patient: Patient;
  onClose: () => void;
  onEdit: (medication: VetMedication) => void;
};

export function MedicationDetailDialog({
  medication,
  patient,
  onClose,
  onEdit,
}: MedicationDetailDialogProps) {
  const { t, i18n } = useTranslation();
  const apolloClient = useApolloClient();
  const [stopError, setStopError] = useState<string | null>(null);
  const [updateMedication, updateState] = useMutation(UPDATE_VET_MEDICATION_MUTATION);

  useEffect(() => {
    if (!medication) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [medication]);

  if (!medication) {
    return null;
  }

  const statusLabel = medication.isActive
    ? t('medications.statusActive')
    : t('medications.statusStopped');

  const handleStop = async () => {
    setStopError(null);
    try {
      await updateMedication({
        variables: {
          id: medication.id,
          input: {
            isActive: false,
            endDate: dateInputToIso(todayDateInputValue()),
          },
        },
      });
      await apolloClient.refetchQueries({ include: 'active' });
      onClose();
    } catch (error) {
      setStopError(getAuthErrorMessage(error, 'save-medication'));
    }
  };

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
            <h2 className="patient-form-dialog__title">{medication.name}</h2>
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
              <dt>{t('medications.dosage')}</dt>
              <dd>{formatDosageLine(medication)}</dd>
            </div>
            <div>
              <dt>{t('medications.startDate')}</dt>
              <dd>{formatMedicationDate(medication.startDate, i18n.language)}</dd>
            </div>
            {medication.endDate ? (
              <div>
                <dt>{t('medications.endDate')}</dt>
                <dd>{formatMedicationDate(medication.endDate, i18n.language)}</dd>
              </div>
            ) : null}
            <div>
              <dt>{t('medications.status')}</dt>
              <dd>{statusLabel}</dd>
            </div>
            <div>
              <dt>{t('medications.patient')}</dt>
              <dd>{patient.name}</dd>
            </div>
            {medication.veterinarianName ? (
              <div>
                <dt>{t('medications.veterinarian')}</dt>
                <dd>{medication.veterinarianName}</dd>
              </div>
            ) : null}
            {medication.clinicName ? (
              <div>
                <dt>{t('patients.clinic')}</dt>
                <dd>{medication.clinicName}</dd>
              </div>
            ) : null}
            {medication.notes ? (
              <div>
                <dt>{t('medications.notes')}</dt>
                <dd>{medication.notes}</dd>
              </div>
            ) : null}
          </dl>

          {stopError ? (
            <p className="patient-form-dialog__error" role="alert">{stopError}</p>
          ) : null}

          <div className="patient-form-dialog__actions">
            {medication.isActive ? (
              <button
                type="button"
                className="ph-button ph-button--secondary"
                disabled={updateState.loading}
                onClick={() => void handleStop()}
              >
                {t('medications.stopMedication')}
              </button>
            ) : null}
            <button
              type="button"
              className="ph-button ph-button--primary"
              onClick={() => onEdit(medication)}
            >
              {t('medications.editMedication')}
            </button>
          </div>
        </div>
      </div>
    </DialogPortal>
  );
}
