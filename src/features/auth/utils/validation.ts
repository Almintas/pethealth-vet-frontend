export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export type LoginField = 'email' | 'password';

export type RegisterField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'password'
  | 'licenseNumber';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function hasFieldErrors<T extends string>(
  errors: FieldErrors<T>,
): boolean {
  return Object.values(errors).some(Boolean);
}

export function validateLoginForm(input: {
  email: string;
  password: string;
}): FieldErrors<LoginField> {
  const errors: FieldErrors<LoginField> = {};

  if (!input.email.trim()) {
    errors.email = 'validation.emailRequired';
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = 'validation.emailInvalid';
  }

  if (!input.password) {
    errors.password = 'validation.passwordRequired';
  }

  return errors;
}

export function validateRegisterForm(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  licenseNumber: string;
}): FieldErrors<RegisterField> {
  const errors: FieldErrors<RegisterField> = {};

  if (!input.firstName.trim()) {
    errors.firstName = 'validation.firstNameRequired';
  }

  if (!input.lastName.trim()) {
    errors.lastName = 'validation.lastNameRequired';
  }

  if (!input.email.trim()) {
    errors.email = 'validation.emailRequired';
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = 'validation.emailInvalid';
  }

  if (!input.password) {
    errors.password = 'validation.passwordRequired';
  } else if (input.password.length < 8) {
    errors.password = 'validation.passwordMin';
  }

  if (!input.licenseNumber.trim()) {
    errors.licenseNumber = 'validation.licenseNumberRequired';
  }

  return errors;
}
