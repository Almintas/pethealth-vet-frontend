import { useApolloClient, useMutation } from '@apollo/client/react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DialogPortal } from '../../../components/feedback/DialogPortal';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import type { Patient } from '../../patients/types';
import {
  CREATE_VET_MEDICATION_MUTATION,
  UPDATE_VET_MEDICATION_MUTATION,
} from '../graphql';
import type { VetMedication } from '../types';
import {
  dateInputToIso,
  isoDateToInputValue,
  todayDateInputValue,
} from '../utils/medication-display';
import '../../patients/components/patient-form-dialog.css';

type MedicationFormDialogProps = {
  mode: 'add' | 'edit';
  open: boolean;
  onClose: () => void;
  patient: Patient;
  clinics: { id: string; name: string }[];
  medication?: VetMedication;
  onSuccess?: () => void;
};

type FormState = {
  clinicId: string;
  name: string;
  dosage: string;
  dosageUnit: string;
  frequency: string;
  startDate: string;
  endDate: string;
  notes: string;
};

type FieldErrors = Partial<
  Record<
    'clinicId' | 'name' | 'dosage' | 'dosageUnit' | 'frequency' | 'startDate' | 'endDate',
    string
  >
>;

function buildInitialForm(
  mode: 'add' | 'edit',
  patient: Patient,
  clinics: { id: string; name: string }[],
  medication?: VetMedication,
): FormState {
  const accessibleClinicIds = new Set(
    patient.clinicAccesses.map((access) => access.clinicId),
  );
  const defaultClinic =
    clinics.find((clinic) => accessibleClinicIds.has(clinic.id))?.id ?? '';

  if (mode === 'edit' && medication) {
    return {
      clinicId: defaultClinic,
      name: medication.name,
      dosage: String(medication.dosage),
      dosageUnit: medication.dosageUnit,
      frequency: medication.frequency,
      startDate: isoDateToInputValue(medication.startDate),
      endDate: medication.endDate ? isoDateToInputValue(medication.endDate) : '',
      notes: medication.notes ?? '',
    };
  }

  return {
    clinicId: defaultClinic,
    name: '',
    dosage: '',
    dosageUnit: '',
    frequency: '',
    startDate: todayDateInputValue(),
    endDate: '',
    notes: '',
  };
}

export function MedicationFormDialog({
  mode,
  open,
  onClose,
  patient,
  clinics,
  medication,
  onSuccess,
}: MedicationFormDialogProps) {
  const { t } = useTranslation();
  const apolloClient = useApolloClient();
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(mode, patient, clinics, medication),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const clinicOptions = useMemo(() => {
    const accessibleIds = new Set(
      patient.clinicAccesses.map((access) => access.clinicId),
    );
    return clinics.filter((clinic) => accessibleIds.has(clinic.id));
  }, [clinics, patient.clinicAccesses]);

  const [createMedication, createState] = useMutation(CREATE_VET_MEDICATION_MUTATION);
  const [updateMedication, updateState] = useMutation(UPDATE_VET_MEDICATION_MUTATION);

  const isSaving = createState.loading || updateState.loading;

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const requiredMark = (required: boolean) =>
    required ? <span className="patient-form-dialog__required">*</span> : null;

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (mode === 'add' && !form.clinicId) {
      errors.clinicId = t('patients.validation.clinicRequired');
    }
    if (!form.name.trim()) {
      errors.name = t('medications.validation.nameRequired');
    }
    const dosageValue = Number(form.dosage);
    if (!form.dosage.trim() || Number.isNaN(dosageValue) || dosageValue < 0) {
      errors.dosage = t('medications.validation.dosageRequired');
    }
    if (!form.dosageUnit.trim()) {
      errors.dosageUnit = t('medications.validation.dosageUnitRequired');
    }
    if (!form.frequency.trim()) {
      errors.frequency = t('medications.validation.frequencyRequired');
    }
    if (!form.startDate) {
      errors.startDate = t('medications.validation.startDateRequired');
    }
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      errors.endDate = t('medications.validation.endDateBeforeStart');
    }
    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const dosage = Number(form.dosage);

    try {
      if (mode === 'add') {
        await createMedication({
          variables: {
            input: {
              clinicId: form.clinicId,
              petId: patient.id,
              name: form.name.trim(),
              dosage,
              dosageUnit: form.dosageUnit.trim(),
              frequency: form.frequency.trim(),
              startDate: dateInputToIso(form.startDate),
              endDate: form.endDate ? dateInputToIso(form.endDate) : undefined,
              notes: form.notes.trim() || undefined,
            },
          },
        });
      } else if (medication) {
        await updateMedication({
          variables: {
            id: medication.id,
            input: {
              name: form.name.trim(),
              dosage,
              dosageUnit: form.dosageUnit.trim(),
              frequency: form.frequency.trim(),
              startDate: dateInputToIso(form.startDate),
              endDate: form.endDate ? dateInputToIso(form.endDate) : undefined,
              notes: form.notes.trim() || undefined,
            },
          },
        });
      }
      await apolloClient.refetchQueries({ include: 'active' });
      onSuccess?.();
      onClose();
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'save-medication'));
    }
  };

  const title =
    mode === 'add' ? t('medications.addMedication') : t('medications.editMedication');

  return (
    <DialogPortal>
      <div className="patient-form-dialog__backdrop" role="presentation" onClick={onClose}>
        <div
          className="patient-form-dialog__panel patient-form-dialog__panel--wide"
          role="dialog"
          aria-modal="true"
          aria-labelledby="medication-form-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="patient-form-dialog__header">
            <h2 id="medication-form-title" className="patient-form-dialog__title">
              {title}
            </h2>
            <button
              type="button"
              className="patient-form-dialog__close"
              onClick={onClose}
              aria-label={t('common.close')}
              disabled={isSaving}
            >
              ×
            </button>
          </div>

          <form className="patient-form-dialog__form" onSubmit={handleSubmit} noValidate>
            {formError ? (
              <p className="patient-form-dialog__error" role="alert">{formError}</p>
            ) : null}

            <fieldset className="patient-form-dialog__fieldset">
              <legend>{t('medications.medicationSection')}</legend>

              {mode === 'add' && clinicOptions.length > 1 ? (
                <label className="ph-field">
                  <span className="ph-field__label">
                    {t('patients.clinic')} {requiredMark(true)}
                  </span>
                  <select
                    className="ph-field__select"
                    value={form.clinicId}
                    disabled={isSaving}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, clinicId: event.target.value }))
                    }
                  >
                    <option value="">{t('patients.selectClinic')}</option>
                    {clinicOptions.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.clinicId ? (
                    <span className="ph-field__error" role="alert">{fieldErrors.clinicId}</span>
                  ) : null}
                </label>
              ) : null}

              <label className="ph-field">
                <span className="ph-field__label">
                  {t('medications.medicationName')} {requiredMark(true)}
                </span>
                <input
                  type="text"
                  className="ph-field__input"
                  value={form.name}
                  disabled={isSaving}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
                {fieldErrors.name ? (
                  <span className="ph-field__error" role="alert">{fieldErrors.name}</span>
                ) : null}
              </label>

              <div className="patient-form-dialog__row">
                <label className="ph-field">
                  <span className="ph-field__label">
                    {t('medications.dosage')} {requiredMark(true)}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="ph-field__input"
                    value={form.dosage}
                    disabled={isSaving}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, dosage: event.target.value }))
                    }
                  />
                  {fieldErrors.dosage ? (
                    <span className="ph-field__error" role="alert">{fieldErrors.dosage}</span>
                  ) : null}
                </label>

                <label className="ph-field">
                  <span className="ph-field__label">
                    {t('medications.dosageUnit')} {requiredMark(true)}
                  </span>
                  <input
                    type="text"
                    className="ph-field__input"
                    value={form.dosageUnit}
                    disabled={isSaving}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, dosageUnit: event.target.value }))
                    }
                  />
                  {fieldErrors.dosageUnit ? (
                    <span className="ph-field__error" role="alert">
                      {fieldErrors.dosageUnit}
                    </span>
                  ) : null}
                </label>

                <label className="ph-field">
                  <span className="ph-field__label">
                    {t('medications.frequency')} {requiredMark(true)}
                  </span>
                  <input
                    type="text"
                    className="ph-field__input"
                    value={form.frequency}
                    disabled={isSaving}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, frequency: event.target.value }))
                    }
                  />
                  {fieldErrors.frequency ? (
                    <span className="ph-field__error" role="alert">
                      {fieldErrors.frequency}
                    </span>
                  ) : null}
                </label>
              </div>

              <div className="patient-form-dialog__row">
                <label className="ph-field">
                  <span className="ph-field__label">
                    {t('medications.startDate')} {requiredMark(true)}
                  </span>
                  <input
                    type="date"
                    className="ph-field__input"
                    value={form.startDate}
                    disabled={isSaving}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, startDate: event.target.value }))
                    }
                  />
                  {fieldErrors.startDate ? (
                    <span className="ph-field__error" role="alert">
                      {fieldErrors.startDate}
                    </span>
                  ) : null}
                </label>

                <label className="ph-field">
                  <span className="ph-field__label">{t('medications.endDate')}</span>
                  <input
                    type="date"
                    className="ph-field__input"
                    value={form.endDate}
                    disabled={isSaving}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, endDate: event.target.value }))
                    }
                  />
                  {fieldErrors.endDate ? (
                    <span className="ph-field__error" role="alert">{fieldErrors.endDate}</span>
                  ) : null}
                </label>
              </div>
            </fieldset>

            <fieldset className="patient-form-dialog__fieldset">
              <legend>{t('medications.instructionsSection')}</legend>
              <label className="ph-field">
                <span className="ph-field__label">{t('medications.notes')}</span>
                <textarea
                  className="ph-field__textarea"
                  rows={4}
                  value={form.notes}
                  disabled={isSaving}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </label>
            </fieldset>

            <div className="patient-form-dialog__actions">
              <button
                type="button"
                className="ph-button ph-button--secondary"
                onClick={onClose}
                disabled={isSaving}
              >
                {t('common.cancel')}
              </button>
              <button type="submit" className="ph-button ph-button--primary" disabled={isSaving}>
                {isSaving
                  ? t('common.saving')
                  : mode === 'add'
                    ? t('medications.addMedication')
                    : t('patients.saveChanges')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DialogPortal>
  );
}
