import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { i18n } from '../../../i18n';

export type UserErrorContext =
  | 'auth'
  | 'load-clinics'
  | 'save-clinic'
  | 'load-profile'
  | 'load-medical-records'
  | 'save-medical-record'
  | 'load-medications'
  | 'save-medication'
  | 'load-vaccinations'
  | 'save-vaccination'
  | 'generic-load'
  | 'generic-save';

function isUnauthorizedError(error: unknown): boolean {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some((graphQLError) => {
      const code = graphQLError.extensions?.code;
      return (
        code === 'UNAUTHENTICATED' ||
        graphQLError.message.toLowerCase().includes('unauthorized') ||
        graphQLError.message.toLowerCase().includes('unauthenticated')
      );
    });
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('unauthorized') ||
      message.includes('unauthenticated') ||
      message.includes('jwt')
    );
  }

  return false;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('failed to fetch') ||
      message.includes('network') ||
      message.includes('load failed')
    );
  }

  return false;
}

function isTechnicalMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('graphql') ||
    normalized.includes('networkerror') ||
    normalized.includes('status code') ||
    normalized.includes('http://') ||
    normalized.includes('https://') ||
    normalized.includes('unexpected token') ||
    normalized.includes('syntax error')
  );
}

function mapKnownBackendMessage(message: string): string | null {
  const normalized = message.toLowerCase();
  if (
    normalized.includes('invalid credentials') ||
    normalized === 'unauthorized'
  ) {
    return i18n.t('errors.invalidCredentials');
  }
  if (normalized.includes('owner account with this email already exists')) {
    return i18n.t('patients.claim.ownerHasAccount');
  }
  if (normalized.includes('code is invalid or has expired')) {
    return i18n.t('patients.claim.codeInvalid');
  }
  if (normalized.includes('manages their own account')) {
    return i18n.t('patients.claim.ownerManagesProfile');
  }
  if (
    normalized.includes('already associated with another account') ||
    normalized.includes('email is already associated')
  ) {
    return i18n.t('patients.validation.ownerEmailInUse');
  }
  if (normalized.includes('already exists') || normalized.includes('duplicate')) {
    return i18n.t('errors.emailAlreadyRegistered');
  }
  if (normalized.includes('invalid email address')) {
    return i18n.t('patients.validation.ownerEmailInvalid');
  }
  if (normalized.includes('not found')) {
    return i18n.t('errors.notFound');
  }
  if (
    normalized === 'bad request exception' ||
    normalized.includes('bad request')
  ) {
    return i18n.t('errors.badRequest');
  }
  if (
    normalized.includes('owner system integration') ||
    normalized.includes('owner system')
  ) {
    return i18n.t('errors.ownerIntegration');
  }
  return null;
}

function readGraphQLErrorMessage(error: unknown): string | null {
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }

  const messages = error.errors
    .map((graphQLError) => graphQLError.message.trim())
    .filter(Boolean)
    .filter((message) => !isTechnicalMessage(message));

  if (messages.length === 0) {
    return null;
  }

  const combined = messages.join(' ');
  return mapKnownBackendMessage(combined) ?? combined;
}

export function getUserFacingErrorMessage(
  error: unknown,
  context: UserErrorContext = 'generic-load',
): string {
  if (isUnauthorizedError(error)) {
    return i18n.t('errors.sessionExpired');
  }

  if (isNetworkError(error)) {
    if (context === 'auth') {
      return i18n.t('errors.serverUnreachable');
    }
    return i18n.t(`errors.context.${context}`);
  }

  const graphQLErrorMessage = readGraphQLErrorMessage(error);
  if (graphQLErrorMessage) {
    return graphQLErrorMessage;
  }

  if (error instanceof Error && error.message && !isTechnicalMessage(error.message)) {
    const mapped = mapKnownBackendMessage(error.message);
    if (mapped) {
      return mapped;
    }
    return error.message;
  }

  return i18n.t(`errors.context.${context}`);
}

export function getAuthErrorMessage(
  error: unknown,
  context: UserErrorContext = 'generic-load',
): string {
  return getUserFacingErrorMessage(error, context);
}
