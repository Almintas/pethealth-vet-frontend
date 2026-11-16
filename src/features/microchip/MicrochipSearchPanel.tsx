import { useApolloClient, useMutation } from '@apollo/client/react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { translatePetSpecies } from '../patients/utils/pet-field-display';
import {
  MICROCHIP_SEARCH_QUERY,
  NOTIFY_OWNER_ABOUT_FOUND_PET_MUTATION,
  isPlausibleMicrochip,
  type MicrochipMatch,
  type MicrochipSearchResult,
} from './graphql';
import './microchip-search.css';

type MicrochipSearchPanelProps = {
  clinics: { id: string; name: string }[];
};

type NoticeState = { petId: string; status: 'sent' | 'notSent' | 'failed' };

/**
 * Finds a pet by microchip. Patients of the clinic open directly; for other
 * pets the clinic sees only the name and species and can let the owner know.
 */
export function MicrochipSearchPanel({ clinics }: MicrochipSearchPanelProps) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const [clinicId, setClinicId] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [result, setResult] = useState<MicrochipSearchResult['microchipSearch'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [notifyOwner, notifyState] = useMutation<{ notifyOwnerAboutFoundPet: boolean }>(
    NOTIFY_OWNER_ABOUT_FOUND_PET_MUTATION,
  );

  const selectedClinicId = clinicId || clinics[0]?.id || '';
  if (clinics.length === 0) {
    return null;
  }

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    setResult(null);
    if (!isPlausibleMicrochip(microchip)) {
      setError(t('microchip.invalid'));
      return;
    }
    setError(null);
    setIsSearching(true);
    try {
      const { data } = await client.query<MicrochipSearchResult>({
        query: MICROCHIP_SEARCH_QUERY,
        variables: { input: { clinicId: selectedClinicId, microchip } },
        fetchPolicy: 'network-only',
      });
      setResult(data?.microchipSearch ?? null);
    } catch (caught) {
      const text = caught instanceof Error ? caught.message : '';
      setError(/too many/i.test(text) ? t('microchip.tooMany') : t('microchip.searchFailed'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleNotify = async (match: MicrochipMatch) => {
    setNotice(null);
    try {
      const { data } = await notifyOwner({
        variables: {
          input: {
            clinicId: selectedClinicId,
            microchip,
            petId: match.petId,
            message: message.trim() || undefined,
          },
        },
      });
      setNotice({ petId: match.petId, status: data?.notifyOwnerAboutFoundPet ? 'sent' : 'notSent' });
    } catch {
      setNotice({ petId: match.petId, status: 'failed' });
    }
  };

  return (
    <section className="microchip-search ph-card" aria-labelledby="microchip-search-heading">
      <h2 id="microchip-search-heading" className="microchip-search__title">
        {t('microchip.title')}
      </h2>
      <p className="microchip-search__hint">{t('microchip.hint')}</p>
      <form className="microchip-search__form" onSubmit={(event) => void handleSearch(event)} noValidate>
        {clinics.length > 1 ? (
          <label className="ph-field">
            <span className="ph-field__label">{t('patients.clinic')}</span>
            <select
              className="ph-field__select"
              value={selectedClinicId}
              onChange={(event) => setClinicId(event.target.value)}
            >
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="ph-field microchip-search__number">
          <span className="ph-field__label">{t('microchip.number')}</span>
          <input
            className="ph-field__input"
            inputMode="text"
            autoComplete="off"
            value={microchip}
            maxLength={40}
            placeholder="440 123 456 789 012"
            onChange={(event) => setMicrochip(event.target.value)}
          />
        </label>
        <button type="submit" className="ph-button ph-button--primary" disabled={isSearching}>
          {isSearching ? t('microchip.searching') : t('microchip.search')}
        </button>
      </form>

      {error ? (
        <p className="microchip-search__error" role="alert">
          {error}
        </p>
      ) : null}

      {result && result.matches.length === 0 ? (
        <p className="microchip-search__empty" role="status">
          {t('microchip.notFound', { microchip: result.microchip })}
        </p>
      ) : null}

      {result && result.matches.length > 0 ? (
        <ul className="microchip-search__results" role="status">
          {result.matches.map((match) => (
            <li key={match.petId} className="microchip-search__result">
              <p className="microchip-search__pet">
                <strong>{match.name}</strong> · {translatePetSpecies(match.species, t)}
                {match.breed ? ` · ${match.breed}` : ''}
              </p>
              {match.hasAccess ? (
                <Link className="ph-button ph-button--secondary" to={`/patients/${match.petId}`}>
                  {t('microchip.openPatient')}
                </Link>
              ) : (
                <div className="microchip-search__notify">
                  <p className="microchip-search__no-access">{t('microchip.noAccess')}</p>
                  <label className="ph-field">
                    <span className="ph-field__label">{t('microchip.message')}</span>
                    <textarea
                      className="ph-field__textarea"
                      rows={2}
                      maxLength={1000}
                      value={message}
                      placeholder={t('microchip.messagePlaceholder')}
                      onChange={(event) => setMessage(event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="ph-button ph-button--primary"
                    disabled={notifyState.loading || notice?.petId === match.petId}
                    onClick={() => void handleNotify(match)}
                  >
                    {notifyState.loading ? t('common.saving') : t('microchip.notifyOwner')}
                  </button>
                  {notice?.petId === match.petId ? (
                    <p
                      className={`microchip-search__notice microchip-search__notice--${notice.status}`}
                      role={notice.status === 'sent' ? 'status' : 'alert'}
                    >
                      {t(`microchip.notice.${notice.status}`)}
                    </p>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
