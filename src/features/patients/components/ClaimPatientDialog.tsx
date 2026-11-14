import { useMutation } from '@apollo/client/react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import type { Clinic } from '../../clinics/types';
import { CLAIM_PATIENT_BY_SHARE_CODE_MUTATION, MY_PATIENTS_QUERY } from '../graphql';
import type { ClaimPatientByShareCodeInput, Patient } from '../types';
import './patient-form-dialog.css';

type ClaimPatientDialogProps = {
  open: boolean;
  onClose: () => void;
  onClaimed: (patientId: string) => void;
  clinics: Clinic[];
};

/** Accepts "abcd2345", "ABCD 2345" or "ABCD-2345" and shows "ABCD-2345". */
function normalizeShareCode(value: string): string {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  return compact.length > 4 ? `${compact.slice(0, 4)}-${compact.slice(4)}` : compact;
}

/**
 * Adds an existing PetHealth pet to the clinic using the one-time code the
 * owner generates in their app. The code is the owner's consent.
 */
export function ClaimPatientDialog({
  open,
  onClose,
  onClaimed,
  clinics,
}: ClaimPatientDialogProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [claimPatient, { loading, error, reset }] = useMutation<
    { claimPatientByShareCode: Patient },
    { input: ClaimPatientByShareCodeInput }
  >(CLAIM_PATIENT_BY_SHARE_CODE_MUTATION, {
    refetchQueries: [{ query: MY_PATIENTS_QUERY }],
  });

  if (!open) {
    return null;
  }

  const resolvedClinicId = clinicId || (clinics.length === 1 ? clinics[0]?.id ?? '' : '');

  const handleClose = () => {
    setCode('');
    setClinicId('');
    setFieldError(null);
    reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const compactCode = code.replace(/-/g, '');
    if (!resolvedClinicId) {
      setFieldError(t('patients.validation.clinicRequired'));
      return;
    }
    if (compactCode.length !== 8) {
      setFieldError(t('patients.claim.codeInvalidFormat'));
      return;
    }
    setFieldError(null);

    try {
      const result = await claimPatient({
        variables: { input: { clinicId: resolvedClinicId, code } },
      });
      const patientId = result.data?.claimPatientByShareCode?.id;
      handleClose();
      if (patientId) {
        onClaimed(patientId);
      }
    } catch {
      // Error state is shown via mutation error.
    }
  };

  return (
    <div className="patient-form-dialog__backdrop" role="presentation" onClick={handleClose}>
      <div
        className="patient-form-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-patient-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="patient-form-dialog__header">
          <h2 id="claim-patient-dialog-title" className="patient-form-dialog__title">
            {t('patients.claim.title')}
          </h2>
          <button
            type="button"
            className="patient-form-dialog__close"
            onClick={handleClose}
            aria-label={t('common.close')}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form className="patient-form-dialog__form" onSubmit={(event) => void handleSubmit(event)}>
          <p className="patient-form-dialog__intro">{t('patients.claim.description')}</p>

          {clinics.length > 1 ? (
            <label className="ph-field">
              <span className="ph-field__label">{t('patients.clinic')}</span>
              <select
                className="ph-field__input"
                value={clinicId}
                onChange={(event) => setClinicId(event.target.value)}
              >
                <option value="">{t('patients.selectClinic')}</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="ph-field">
            <span className="ph-field__label">{t('patients.claim.codeLabel')}</span>
            <input
              className="ph-field__input patient-form-dialog__code-input"
              value={code}
              onChange={(event) => setCode(normalizeShareCode(event.target.value))}
              placeholder="ABCD-2345"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              aria-invalid={Boolean(fieldError)}
              autoFocus
            />
            {fieldError ? (
              <span className="patient-form-dialog__field-error" role="alert">
                {fieldError}
              </span>
            ) : null}
          </label>

          {error ? (
            <ErrorAlert compact message={getAuthErrorMessage(error, 'generic-save')} />
          ) : null}

          <div className="patient-form-dialog__actions">
            <button
              type="button"
              className="ph-button ph-button--secondary"
              onClick={handleClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className="ph-button ph-button--primary" disabled={loading}>
              {loading ? t('patients.claim.submitting') : t('patients.claim.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
