import { useMutation } from '@apollo/client/react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import { CREATE_CLINIC_MUTATION, MY_CLINICS_QUERY } from '../graphql';
import type { CreateClinicInput, CreateClinicMutationResult } from '../types';
import '../../patients/components/patient-form-dialog.css';

type CreateClinicDialogProps = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

const EMPTY_FORM: FormState = { name: '', email: '', phone: '', address: '' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Lets an approved veterinarian create their clinic. The API makes the
 * creator an active member, so the clinic is usable immediately.
 */
export function CreateClinicDialog({ open, onClose }: CreateClinicDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const [createClinic, { loading, error, reset }] = useMutation<
    CreateClinicMutationResult,
    { input: CreateClinicInput }
  >(CREATE_CLINIC_MUTATION, {
    refetchQueries: [{ query: MY_CLINICS_QUERY }],
    awaitRefetchQueries: true,
  });

  if (!open) {
    return null;
  }

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    reset();
    onClose();
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) {
      errors.name = t('validation.clinicNameRequired');
    }
    if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
      errors.email = t('validation.emailInvalid');
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await createClinic({
        variables: {
          input: {
            name: form.name.trim(),
            email: optional(form.email)?.toLowerCase(),
            phone: optional(form.phone),
            address: optional(form.address),
          },
        },
      });
      handleClose();
    } catch {
      // Error state is shown via the mutation error.
    }
  };

  const fields: {
    key: keyof FormState;
    label: string;
    type?: string;
    autoComplete?: string;
    required?: boolean;
  }[] = [
    { key: 'name', label: t('clinics.name'), autoComplete: 'organization', required: true },
    { key: 'address', label: t('clinics.address'), autoComplete: 'street-address' },
    { key: 'phone', label: t('clinics.phone'), type: 'tel', autoComplete: 'tel' },
    { key: 'email', label: t('clinics.email'), type: 'email', autoComplete: 'email' },
  ];

  return (
    <div className="patient-form-dialog__backdrop" role="presentation" onClick={handleClose}>
      <div
        className="patient-form-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-clinic-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="patient-form-dialog__header">
          <h2 id="create-clinic-dialog-title" className="patient-form-dialog__title">
            {t('clinics.create.title')}
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

        <form
          className="patient-form-dialog__form"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          <p className="patient-form-dialog__intro">{t('clinics.create.description')}</p>

          {fields.map((field, index) => (
            <label key={field.key} className="ph-field">
              <span className="ph-field__label">
                {field.label}
                {field.required ? (
                  <span className="patient-form-dialog__required"> *</span>
                ) : null}
              </span>
              <input
                className="ph-field__input"
                type={field.type ?? 'text'}
                value={form[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                autoComplete={field.autoComplete}
                aria-invalid={Boolean(fieldErrors[field.key])}
                autoFocus={index === 0}
              />
              {fieldErrors[field.key] ? (
                <span className="patient-form-dialog__field-error" role="alert">
                  {fieldErrors[field.key]}
                </span>
              ) : null}
            </label>
          ))}

          {error ? (
            <ErrorAlert compact message={getAuthErrorMessage(error, 'save-clinic')} />
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
              {loading ? t('clinics.create.submitting') : t('clinics.create.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
