import { useApolloClient, useMutation } from '@apollo/client/react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DialogPortal } from '../../../components/feedback/DialogPortal';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import type { Patient } from '../../patients/types';
import {
  CREATE_VET_VACCINATION_MUTATION,
  UPDATE_VET_VACCINATION_MUTATION,
} from '../graphql';
import type { VetVaccination } from '../types';
import {
  dateInputToIso,
  isoDateToInputValue,
  todayDateInputValue,
} from '../utils/vaccination-display';
import '../../patients/components/patient-form-dialog.css';

type VaccinationFormDialogProps = {
  mode: 'add' | 'edit';
  open: boolean;
  onClose: () => void;
  patient: Patient;
  clinics: { id: string; name: string }[];
  vaccination?: VetVaccination;
  onSuccess?: () => void;
};

type FormState = {
  clinicId: string;
  vaccineName: string;
  administeredAt: string;
  nextDueAt: string;
  batchNumber: string;
  notes: string;
};

type FieldErrors = Partial<
  Record<'clinicId' | 'vaccineName' | 'administeredAt' | 'nextDueAt', string>
>;

function buildInitialForm(
  mode: 'add' | 'edit',
  patient: Patient,
  clinics: { id: string; name: string }[],
  vaccination?: VetVaccination,
): FormState {
  const accessibleClinicIds = new Set(
    patient.clinicAccesses.map((access) => access.clinicId),
  );
  const defaultClinic =
    clinics.find((clinic) => accessibleClinicIds.has(clinic.id))?.id ?? '';

  if (mode === 'edit' && vaccination) {
    return {
      clinicId: defaultClinic,
      vaccineName: vaccination.vaccineName,
      administeredAt: isoDateToInputValue(vaccination.administeredAt),
      nextDueAt: vaccination.nextDueAt
        ? isoDateToInputValue(vaccination.nextDueAt)
        : '',
      batchNumber: vaccination.batchNumber ?? '',
      notes: vaccination.notes ?? '',
    };
  }

  return {
    clinicId: defaultClinic,
    vaccineName: '',
    administeredAt: todayDateInputValue(),
    nextDueAt: '',
    batchNumber: '',
    notes: '',
  };
}

export function VaccinationFormDialog({
  mode,
  open,
  onClose,
  patient,
  clinics,
  vaccination,
  onSuccess,
}: VaccinationFormDialogProps) {
  const { t } = useTranslation();
  const apolloClient = useApolloClient();
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(mode, patient, clinics, vaccination),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const clinicOptions = useMemo(() => {
    const accessibleIds = new Set(
      patient.clinicAccesses.map((access) => access.clinicId),
    );
    return clinics.filter((clinic) => accessibleIds.has(clinic.id));
  }, [clinics, patient.clinicAccesses]);

  const [createVaccination, createState] = useMutation(CREATE_VET_VACCINATION_MUTATION);
  const [updateVaccination, updateState] = useMutation(UPDATE_VET_VACCINATION_MUTATION);

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
    if (!form.vaccineName.trim()) {
      errors.vaccineName = t('vaccinations.validation.vaccineNameRequired');
    }
    if (!form.administeredAt) {
      errors.administeredAt = t('vaccinations.validation.administeredAtRequired');
    }
    if (form.nextDueAt && form.administeredAt && form.nextDueAt < form.administeredAt) {
      errors.nextDueAt = t('vaccinations.validation.nextDueBeforeAdministered');
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

    try {
      if (mode === 'add') {
        await createVaccination({
          variables: {
            input: {
              clinicId: form.clinicId,
              petId: patient.id,
              vaccineName: form.vaccineName.trim(),
              administeredAt: dateInputToIso(form.administeredAt),
              nextDueAt: form.nextDueAt ? dateInputToIso(form.nextDueAt) : undefined,
              batchNumber: form.batchNumber.trim() || undefined,
              notes: form.notes.trim() || undefined,
            },
          },
        });
      } else if (vaccination) {
        await updateVaccination({
          variables: {
            id: vaccination.id,
            input: {
              vaccineName: form.vaccineName.trim(),
              administeredAt: dateInputToIso(form.administeredAt),
              nextDueAt: form.nextDueAt ? dateInputToIso(form.nextDueAt) : undefined,
              batchNumber: form.batchNumber.trim() || undefined,
              notes: form.notes.trim() || undefined,
            },
          },
        });
      }
      await apolloClient.refetchQueries({ include: 'active' });
      onSuccess?.();
      onClose();
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'save-vaccination'));
    }
  };

  const title =
    mode === 'add' ? t('vaccinations.addVaccination') : t('vaccinations.editVaccination');

  return (
    <DialogPortal>
      <div className="patient-form-dialog__backdrop" role="presentation" onClick={onClose}>
        <div
          className="patient-form-dialog__panel patient-form-dialog__panel--wide"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vaccination-form-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="patient-form-dialog__header">
            <h2 id="vaccination-form-title" className="patient-form-dialog__title">
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
              <legend>{t('vaccinations.vaccinationSection')}</legend>

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
                  {t('vaccinations.vaccineProduct')} {requiredMark(true)}
                </span>
                <input
                  type="text"
                  className="ph-field__input"
                  value={form.vaccineName}
                  disabled={isSaving}
                  placeholder={t('vaccinations.vaccineProductPlaceholder')}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, vaccineName: event.target.value }))
                  }
                />
                {fieldErrors.vaccineName ? (
                  <span className="ph-field__error" role="alert">
                    {fieldErrors.vaccineName}
                  </span>
                ) : null}
              </label>

              <div className="patient-form-dialog__row">
                <label className="ph-field">
                  <span className="ph-field__label">
                    {t('vaccinations.dateAdministered')} {requiredMark(true)}
                  </span>
                  <input
                    type="date"
                    className="ph-field__input"
                    value={form.administeredAt}
                    disabled={isSaving}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        administeredAt: event.target.value,
                      }))
                    }
                  />
                  {fieldErrors.administeredAt ? (
                    <span className="ph-field__error" role="alert">
                      {fieldErrors.administeredAt}
                    </span>
                  ) : null}
                </label>

                <label className="ph-field">
                  <span className="ph-field__label">{t('vaccinations.nextDueDate')}</span>
                  <input
                    type="date"
                    className="ph-field__input"
                    value={form.nextDueAt}
                    disabled={isSaving}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, nextDueAt: event.target.value }))
                    }
                  />
                  <span className="patient-form-dialog__field-hint">
                    {t('vaccinations.nextDueDateHint')}
                  </span>
                  {fieldErrors.nextDueAt ? (
                    <span className="ph-field__error" role="alert">{fieldErrors.nextDueAt}</span>
                  ) : null}
                </label>
              </div>
            </fieldset>

            <fieldset className="patient-form-dialog__fieldset">
              <legend>{t('vaccinations.additionalInformation')}</legend>
              <label className="ph-field">
                <span className="ph-field__label">{t('vaccinations.batchNumber')}</span>
                <input
                  type="text"
                  className="ph-field__input"
                  value={form.batchNumber}
                  disabled={isSaving}
                  placeholder={t('vaccinations.batchNumberPlaceholder')}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, batchNumber: event.target.value }))
                  }
                />
                <span className="patient-form-dialog__field-hint">
                  {t('vaccinations.batchNumberHint')}
                </span>
              </label>
              <label className="ph-field">
                <span className="ph-field__label">{t('vaccinations.notes')}</span>
                <textarea
                  className="ph-field__textarea"
                  rows={4}
                  value={form.notes}
                  disabled={isSaving}
                  placeholder={t('vaccinations.notesPlaceholder')}
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
                    ? t('vaccinations.addVaccination')
                    : t('patients.saveChanges')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DialogPortal>
  );
}
