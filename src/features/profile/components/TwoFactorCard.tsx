import { useMutation } from '@apollo/client/react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { useAuth } from '../../auth';
import {
  CONFIRM_TWO_FACTOR_SETUP_MUTATION,
  DISABLE_TWO_FACTOR_MUTATION,
  START_TWO_FACTOR_SETUP_MUTATION,
} from '../../auth/graphql';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import './two-factor-card.css';

type Setup = { secret: string; otpauthUrl: string };

function groupKey(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Turn two-factor sign-in on or off. Setup shows the key (and an otpauth://
 * link that opens authenticator apps on a phone), asks for a first code, then
 * shows one-time recovery codes once.
 */
export function TwoFactorCard() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const enabled = Boolean(user?.twoFactorEnabled);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [isDisabling, setIsDisabling] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [startSetup, startState] = useMutation<{ startTwoFactorSetup: Setup }>(
    START_TWO_FACTOR_SETUP_MUTATION,
  );
  const [confirmSetup, confirmState] = useMutation<{
    confirmTwoFactorSetup: { recoveryCodes: string[] };
  }>(CONFIRM_TWO_FACTOR_SETUP_MUTATION);
  const [disable, disableState] = useMutation<{ disableTwoFactor: boolean }>(
    DISABLE_TWO_FACTOR_MUTATION,
  );
  const busy = startState.loading || confirmState.loading || disableState.loading;

  const reset = () => {
    setSetup(null);
    setIsDisabling(false);
    setCode('');
    setError(null);
  };

  const handleStart = async () => {
    reset();
    setRecoveryCodes(null);
    try {
      const result = await startSetup();
      setSetup(result.data?.startTwoFactorSetup ?? null);
    } catch (startError) {
      setError(getAuthErrorMessage(startError, 'generic-save'));
    }
  };

  const handleConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const result = await confirmSetup({ variables: { code: code.trim() } });
      setRecoveryCodes(result.data?.confirmTwoFactorSetup.recoveryCodes ?? []);
      reset();
      await refreshUser();
    } catch (confirmError) {
      setError(getAuthErrorMessage(confirmError, 'generic-save'));
    }
  };

  const handleDisable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await disable({ variables: { code: code.trim() } });
      reset();
      setRecoveryCodes(null);
      await refreshUser();
    } catch (disableError) {
      setError(getAuthErrorMessage(disableError, 'generic-save'));
    }
  };

  const copyCodes = async () => {
    if (!recoveryCodes) {
      return;
    }
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="ph-card ph-card--pad two-factor-card" aria-labelledby="two-factor-title">
      <div className="two-factor-card__header">
        <div>
          <h2 id="two-factor-title" className="two-factor-card__title">
            {t('twoFactor.title')}
          </h2>
          <p className="two-factor-card__intro">{t('twoFactor.intro')}</p>
        </div>
        <span className={`ph-badge ${enabled ? 'ph-badge--success' : 'two-factor-card__off'}`}>
          {enabled ? t('twoFactor.on') : t('twoFactor.off')}
        </span>
      </div>

      {error ? <ErrorAlert compact message={error} /> : null}

      {recoveryCodes ? (
        <div className="two-factor-card__codes" role="status">
          <p className="two-factor-card__strong">{t('twoFactor.recoveryTitle')}</p>
          <p className="two-factor-card__muted">{t('twoFactor.recoveryText')}</p>
          <ul className="two-factor-card__code-list">
            {recoveryCodes.map((value) => (
              <li key={value}>
                <code>{value}</code>
              </li>
            ))}
          </ul>
          <div className="two-factor-card__actions">
            <button type="button" className="ph-button ph-button--secondary" onClick={() => void copyCodes()}>
              {copied ? t('twoFactor.copied') : t('twoFactor.copyCodes')}
            </button>
            <button type="button" className="ph-button ph-button--primary" onClick={() => setRecoveryCodes(null)}>
              {t('twoFactor.savedCodes')}
            </button>
          </div>
        </div>
      ) : null}

      {!enabled && !setup && !recoveryCodes ? (
        <button
          type="button"
          className="ph-button ph-button--primary"
          onClick={() => void handleStart()}
          disabled={busy}
        >
          {t('twoFactor.enable')}
        </button>
      ) : null}

      {setup ? (
        <form className="two-factor-card__setup" onSubmit={(event) => void handleConfirm(event)}>
          <ol className="two-factor-card__steps">
            <li>{t('twoFactor.stepApp')}</li>
            <li>
              {t('twoFactor.stepKey')}
              <code className="two-factor-card__key">{groupKey(setup.secret)}</code>
              <a className="ph-link-button" href={setup.otpauthUrl}>
                {t('twoFactor.openInApp')}
              </a>
            </li>
            <li>{t('twoFactor.stepCode')}</li>
          </ol>
          <label className="ph-field two-factor-card__code-field">
            <span className="ph-field__label">{t('twoFactor.codeLabel')}</span>
            <input
              className="ph-field__input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoFocus
            />
          </label>
          <div className="two-factor-card__actions">
            <button type="button" className="ph-button ph-button--secondary" onClick={reset} disabled={busy}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="ph-button ph-button--primary" disabled={busy}>
              {t('twoFactor.confirm')}
            </button>
          </div>
        </form>
      ) : null}

      {enabled && !isDisabling && !recoveryCodes ? (
        <button
          type="button"
          className="ph-button ph-button--secondary two-factor-card__danger"
          onClick={() => {
            reset();
            setIsDisabling(true);
          }}
        >
          {t('twoFactor.disable')}
        </button>
      ) : null}

      {enabled && isDisabling ? (
        <form className="two-factor-card__setup" onSubmit={(event) => void handleDisable(event)}>
          <p className="two-factor-card__muted">{t('twoFactor.disableText')}</p>
          <label className="ph-field two-factor-card__code-field">
            <span className="ph-field__label">{t('twoFactor.codeLabel')}</span>
            <input
              className="ph-field__input"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoFocus
            />
          </label>
          <div className="two-factor-card__actions">
            <button type="button" className="ph-button ph-button--secondary" onClick={reset} disabled={busy}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="ph-button ph-button--primary two-factor-card__danger-solid" disabled={busy}>
              {t('twoFactor.disableConfirm')}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
