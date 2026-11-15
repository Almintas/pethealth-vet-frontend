import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../i18n';
import { APP_LANGUAGE_OPTIONS, resolveAppLanguage } from '../i18n/language-options';

type AccountMenuLanguageGroupProps = {
  onLanguageSelected?: () => void;
};

export function AccountMenuLanguageGroup({
  onLanguageSelected,
}: AccountMenuLanguageGroupProps) {
  const { t, i18n } = useTranslation();
  const current = resolveAppLanguage(i18n.language);

  return (
    <div
      className="sidebar-user-menu__language"
      role="group"
      aria-label={t('common.language')}
    >
      <p className="sidebar-user-menu__language-heading">{t('common.language')}</p>
      <ul className="sidebar-user-menu__language-list">
        {APP_LANGUAGE_OPTIONS.map((option) => {
          const isActive = current === option.value;
          return (
            <li key={option.value}>
              <button
                type="button"
                role="menuitemradio"
                className={[
                  'sidebar-user-menu__language-option',
                  isActive ? 'sidebar-user-menu__language-option--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-checked={isActive}
                onClick={() => {
                  if (!isActive) {
                    changeAppLanguage(option.value);
                  }
                  onLanguageSelected?.();
                }}
              >
                <span className="sidebar-user-menu__language-option-label">
                  {t(option.labelKey)}
                </span>
                {isActive ? (
                  <span className="sidebar-user-menu__language-check" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
