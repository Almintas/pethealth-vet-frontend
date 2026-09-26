import { useApolloClient, useMutation } from '@apollo/client/react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DialogPortal } from '../../../components/feedback/DialogPortal';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import type { Patient } from '../../patients/types';
import {
  DEFAULT_MEDICAL_RECORD_TYPE,
  MEDICAL_RECORD_TYPE_OPTIONS,
  normalizeMedicalRecordTypeValue,
  type MedicalRecordTypeValue,
} from '../constants/medical-record-types';
import {
  CREATE_VET_MEDICAL_RECORD_MUTATION,
  UPDATE_VET_MEDICAL_RECORD_MUTATION,
} from '../graphql';
import type { VetMedicalRecord } from '../types';
import {
  dateInputToIso,
  isoDateToInputValue,
} from '../utils/medical-record-display';
import '../../patients/components/patient-form-dialog.css';

type MedicalRecordFormDialogProps = {
  mode: 'add' | 'edit';
  open: boolean;
  onClose: () => void;
  patient: Patient;
  clinics: { id: string; name: string }[];
  record?: VetMedicalRecord;
  onSuccess?: () => void;
};

type FormState = {
  clinicId: string;
  date: string;
  type: MedicalRecordTypeValue;
  title: string;
  description: string;
  diagnosis: string;
  notes: string;
};

type FieldErrors = Partial<Record<'clinicId' | 'date' | 'type' | 'title', string>>;

function buildInitialForm(
  mode: 'add' | 'edit',
  patient: Patient,
  clinics: { id: string; name: string }[],
  record?: VetMedicalRecord,
): FormState {
  const accessibleClinicIds = new Set(
    patient.clinicAccesses.map((access) => access.clinicId),
  );
  const defaultClinic =
    clinics.find((clinic) => accessibleClinicIds.has(clinic.id))?.id ?? '';

  if (mode === 'edit' && record) {
    return {
      clinicId: defaultClinic,
      date: isoDateToInputValue(record.date),
      type: normalizeMedicalRecordTypeValue(record.type),
      title: record.title,
      description: record.description ?? '',
      diagnosis: record.diagnosis ?? '',
      notes: record.notes ?? '',
    };
  }

  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return {
    clinicId: defaultClinic,
    date: `${today.getFullYear()}-${month}-${day}`,
    type: DEFAULT_MEDICAL_RECORD_TYPE,
    title: '',
    description: '',
    diagnosis: '',
    notes: '',
  };
}

export function MedicalRecordFormDialog({
  mode,
  open,
  onClose,
  patient,
  clinics,
  record,
  onSuccess,
}: MedicalRecordFormDialogProps) {
  const { t } = useTranslation();
  const apolloClient = useApolloClient();
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(mode, patient, clinics, record),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const clinicOptions = useMemo(() => {
    const accessibleIds = new Set(
      patient.clinicAccesses.map((access) => access.clinicId),
    );
    return clinics.filter((clinic) => accessibleIds.has(clinic.id));
  }, [clinics, patient.clinicAccesses]);

  const [createRecord, createState] = useMutation(CREATE_VET_MEDICAL_RECORD_MUTATION);
  const [updateRecord, updateState] = useMutation(UPDATE_VET_MEDICAL_RECORD_MUTATION);

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
    if (!form.date) {
      errors.date = t('medicalRecords.validation.dateRequired');
    }
    if (!form.type) {
      errors.type = t('medicalRecords.validation.typeRequired');
    }
    if (!form.title.trim()) {
      errors.title = t('medicalRecords.validation.titleRequired');
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
        await createRecord({
          variables: {
            input: {
              clinicId: form.clinicId,
              petId: patient.id,
              date: dateInputToIso(form.date),
              type: form.type,
              title: form.title.trim(),
              description: form.description.trim() || undefined,
              diagnosis: form.diagnosis.trim() || undefined,
              notes: form.notes.trim() || undefined,
            },
          },
        });
      } else if (record) {
        await updateRecord({
          variables: {
            id: record.id,
            input: {
              date: dateInputToIso(form.date),
              type: form.type,
              title: form.title.trim(),
              description: form.description.trim() || undefined,
              diagnosis: form.diagnosis.trim() || undefined,
              notes: form.notes.trim() || undefined,
            },
          },
        });
      }
      await apolloClient.refetchQueries({ include: 'active' });
      onSuccess?.();
      onClose();
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'save-medical-record'));
    }
  };

  const title =
    mode === 'add'
      ? t('medicalRecords.addMedicalRecord')
      : t('medicalRecords.editMedicalRecord');

  return (
    <DialogPortal>
      <div className="patient-form-dialog__backdrop" role="presentation" onClick={onClose}>
        <div
          className="patient-form-dialog__panel patient-form-dialog__panel--wide"
          role="dialog"
          aria-modal="true"
          aria-labelledby="medical-record-form-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="patient-form-dialog__header">
            <h2 id="medical-record-form-title" className="patient-form-dialog__title">
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
              <legend>{t('medicalRecords.recordInformation')}</legend>

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

              <div className="patient-form-dialog__row">
                <label className="ph-field">
                  <span className="ph-field__label">
                    {t('medicalRecords.recordDate')} {requiredMark(true)}
                  </span>
                  <input
                    type="date"
                    className="ph-field__input"
                    value={form.date}
                    disabled={isSaving}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, date: event.target.value }))
                    }
                  />
                  {fieldErrors.date ? (
                    <span className="ph-field__error" role="alert">{fieldErrors.date}</span>
                  ) : null}
                </label>

                <label className="ph-field">
                  <span className="ph-field__label">
                    {t('medicalRecords.recordType')} {requiredMark(true)}
                  </span>
                  <select
                    className="ph-field__select"
                    value={form.type}
                    disabled={isSaving}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value as MedicalRecordTypeValue,
                      }))
                    }
                  >
                    {MEDICAL_RECORD_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(`enums.medicalRecordType.${option.value}`)}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.type ? (
                    <span className="ph-field__error" role="alert">{fieldErrors.type}</span>
                  ) : null}
                </label>
              </div>

              <label className="ph-field">
                <span className="ph-field__label">
                  {t('medicalRecords.titleReason')} {requiredMark(true)}
                </span>
                <input
                  type="text"
                  className="ph-field__input"
                  value={form.title}
                  disabled={isSaving}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
                {fieldErrors.title ? (
                  <span className="ph-field__error" role="alert">{fieldErrors.title}</span>
                ) : null}
              </label>
            </fieldset>

            <fieldset className="patient-form-dialog__fieldset">
              <legend>{t('medicalRecords.clinicalNotes')}</legend>

              <label className="ph-field">
                <span className="ph-field__label">{t('medicalRecords.diagnosis')}</span>
                <textarea
                  className="ph-field__textarea"
                  rows={2}
                  value={form.diagnosis}
                  disabled={isSaving}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, diagnosis: event.target.value }))
                  }
                />
              </label>

              <label className="ph-field">
                <span className="ph-field__label">{t('medicalRecords.notes')}</span>
                <textarea
                  className="ph-field__textarea"
                  rows={3}
                  value={form.notes}
                  disabled={isSaving}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </label>

              <label className="ph-field">
                <span className="ph-field__label">{t('medicalRecords.treatment')}</span>
                <textarea
                  className="ph-field__textarea"
                  rows={3}
                  value={form.description}
                  disabled={isSaving}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
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
                    ? t('medicalRecords.addMedicalRecord')
                    : t('patients.saveChanges')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DialogPortal>
  );
}
