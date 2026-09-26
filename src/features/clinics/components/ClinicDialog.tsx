import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';

export type ClinicFormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

type ClinicDialogProps = {
  isOpen: boolean;
  title: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ClinicFormValues) => Promise<void>;
};

const emptyValues: ClinicFormValues = {
  name: '',
  email: '',
  phone: '',
  address: '',
};

export function ClinicDialog({
  isOpen,
  title,
  isSubmitting,
  onClose,
  onSubmit,
}: ClinicDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [values, setValues] = useState<ClinicFormValues>(emptyValues);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!values.name.trim()) {
      setNameError(t('validation.clinicNameRequired'));
      return;
    }

    setNameError(null);
    try {
      await onSubmit({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
      });
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'save-clinic'));
    }
  };

  return (
    <div className="clinic-dialog" role="presentation">
      <button
        type="button"
        className="clinic-dialog__backdrop"
        aria-label={t('common.close')}
        onClick={onClose}
        disabled={isSubmitting}
      />
      <div
        className="clinic-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="clinic-dialog__header">
          <h3 id={titleId} className="clinic-dialog__title">{title}</h3>
          <button
            ref={closeButtonRef}
            type="button"
            className="clinic-dialog__close"
            onClick={onClose}
            aria-label={t('common.close')}
            disabled={isSubmitting}
          >
            ×
          </button>
        </header>
        <div className="clinic-dialog__body">
          <form className="clinic-dialog__form" onSubmit={handleSubmit} noValidate>
            {formError ? (
              <p className="auth-alert" role="alert">{formError}</p>
            ) : null}

            <div className="ph-field">
              <label className="ph-field__label" htmlFor="clinic-name">
                {t('clinics.name')}
              </label>
              <input
                id="clinic-name"
                className="ph-field__input"
                value={values.name}
                onChange={(event) => setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))}
                disabled={isSubmitting}
                aria-invalid={nameError ? true : undefined}
              />
              {nameError ? (
                <p className="ph-field__error" role="alert">{nameError}</p>
              ) : null}
            </div>

            <div className="ph-field">
              <label className="ph-field__label" htmlFor="clinic-email">
                {t('clinics.email')}
              </label>
              <input
                id="clinic-email"
                type="email"
                className="ph-field__input"
                value={values.email}
                onChange={(event) => setValues((current) => ({
                  ...current,
                  email: event.target.value,
                }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="ph-field">
              <label className="ph-field__label" htmlFor="clinic-phone">
                {t('clinics.phone')}
              </label>
              <input
                id="clinic-phone"
                type="tel"
                className="ph-field__input"
                value={values.phone}
                onChange={(event) => setValues((current) => ({
                  ...current,
                  phone: event.target.value,
                }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="ph-field">
              <label className="ph-field__label" htmlFor="clinic-address">
                {t('clinics.address')}
              </label>
              <textarea
                id="clinic-address"
                className="ph-field__textarea"
                rows={3}
                value={values.address}
                onChange={(event) => setValues((current) => ({
                  ...current,
                  address: event.target.value,
                }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="clinic-dialog__actions">
              <button
                type="button"
                className="ph-button ph-button--secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="ph-button ph-button--primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('common.saving') : t('clinics.createClinic')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
