import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { createInstance } from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import en from '../../../i18n/locales/en';
import { getUserFacingErrorMessage } from './get-auth-error-message';

// The app's i18n module touches the DOM; use a plain instance with real strings.
const i18n = vi.hoisted(() => ({ current: undefined as unknown }));
vi.mock('../../../i18n', async () => {
  const instance = createInstance();
  await instance.init({ lng: 'en', resources: { en: { translation: en } } });
  i18n.current = instance;
  return { i18n: instance, default: instance };
});
const t = (key: string) =>
  (i18n.current as { t: (key: string) => string }).t(key);

function graphQLError(message: string, code: string): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: [{ message, extensions: { code } }],
  });
}

describe('getUserFacingErrorMessage', () => {
  it('reports wrong credentials as such, not as an expired session', () => {
    expect(
      getUserFacingErrorMessage(graphQLError('Invalid email or password', 'UNAUTHENTICATED'), 'auth'),
    ).toBe(t('errors.invalidCredentials'));
  });

  it('reports a rejected token as an expired session', () => {
    expect(
      getUserFacingErrorMessage(graphQLError('Unauthorized', 'UNAUTHENTICATED')),
    ).toBe(t('errors.sessionExpired'));
  });

  it.each([
    [
      'This invitation link is invalid or has expired. Ask the clinic to send a new one.',
      'invite.states.EXPIRED',
    ],
    [
      'This invitation was sent to a different email address. Sign in with that email to accept it.',
      'clinicTeam.errors.wrongEmail',
    ],
    ['This person is already a member of the clinic.', 'clinicTeam.errors.alreadyMember'],
    [
      'A clinic needs at least one administrator. Invite another administrator first.',
      'clinicTeam.errors.lastAdmin',
    ],
  ])('translates the team error "%s"', (message, key) => {
    expect(getUserFacingErrorMessage(graphQLError(message, 'BAD_REQUEST'))).toBe(t(key));
  });

  it('reports a wrong two-factor code as such, not as an expired session', () => {
    expect(
      getUserFacingErrorMessage(
        graphQLError(
          'That code is not valid. Check the time on your phone and try again.',
          'UNAUTHENTICATED',
        ),
        'auth',
      ),
    ).toBe(t('twoFactor.errors.invalidCode'));
  });
});
