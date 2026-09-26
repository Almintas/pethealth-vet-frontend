import type { InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

type AuthFormFieldProps = {
  id: string;
  label: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function AuthFormField({
  id,
  label,
  error,
  className,
  ...inputProps
}: AuthFormFieldProps) {
  const { t } = useTranslation();
  const errorMessage = error ? t(error) : undefined;

  return (
    <div className="auth-field">
      <label className="auth-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={['auth-field__input', className].filter(Boolean).join(' ')}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={errorMessage ? `${id}-error` : undefined}
        {...inputProps}
      />
      {errorMessage ? (
        <p className="auth-field__error" id={`${id}-error`} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
