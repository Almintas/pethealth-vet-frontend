import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../i18n';
import { APP_LANGUAGE_OPTIONS, resolveAppLanguage } from '../i18n/language-options';
import type { AppLanguage } from '../i18n';
import './language-selector.css';

type LanguageSelectorProps = {
  variant?: 'compact' | 'settings';
  className?: string;
};

export function LanguageSelector({
  variant = 'compact',
  className = '',
}: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const current = resolveAppLanguage(i18n.language);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as AppLanguage;
    changeAppLanguage(next);
  };

  if (variant === 'settings') {
    return (
      <select
        id="settings-language"
        className={['ph-form__select', className].filter(Boolean).join(' ')}
        value={current}
        onChange={handleChange}
        aria-label={t('common.selectLanguage')}
      >
        {APP_LANGUAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    );
  }

  return (
    <label className={['language-selector', className].filter(Boolean).join(' ')}>
      <span className="language-selector__icon" aria-hidden="true">🌐</span>
      <span className="language-selector__label">{t('common.language')}</span>
      <select
        className="language-selector__select"
        value={current}
        onChange={handleChange}
        aria-label={t('common.selectLanguage')}
      >
        {APP_LANGUAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}
