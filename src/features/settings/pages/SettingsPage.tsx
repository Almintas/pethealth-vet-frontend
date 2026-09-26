import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../../../components/LanguageSelector';
import { useTheme, type ThemePreference } from '../../../theme';
import '../../../components/language-selector.css';
import './settings-page.css';

export function SettingsPage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const themeOptions = useMemo(
    (): { value: ThemePreference; label: string }[] => [
      { value: 'light', label: t('settings.themeLight') },
      { value: 'dark', label: t('settings.themeDark') },
      { value: 'system', label: t('settings.themeSystem') },
    ],
    [t],
  );

  return (
    <div className="ph-page">
      <header className="ph-page-header">
        <div>
          <p className="ph-page-header__eyebrow">{t('navigation.settings')}</p>
          <h1 className="ph-page-header__title">{t('settings.title')}</h1>
          <p className="ph-page-header__subtitle">{t('settings.subtitle')}</p>
        </div>
      </header>

      <section className="ph-card ph-card--pad settings-section">
        <h2 className="settings-section__title">{t('settings.appearance')}</h2>
        <div className="settings-section__options" role="radiogroup" aria-label={t('settings.appearance')}>
          {themeOptions.map((option) => (
            <label key={option.value} className="settings-section__option">
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={theme === option.value}
                onChange={() => setTheme(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="ph-card ph-card--pad settings-section">
        <h2 className="settings-section__title">{t('settings.language')}</h2>
        <p className="settings-section__description">{t('settings.languageDescription')}</p>
        <LanguageSelector variant="settings" />
      </section>
    </div>
  );
}
