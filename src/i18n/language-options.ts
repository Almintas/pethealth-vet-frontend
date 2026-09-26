import type { AppLanguage } from './language-storage';

export const APP_LANGUAGE_OPTIONS: {
  value: AppLanguage;
  labelKey: 'common.languageEnglish' | 'common.languageLithuanian';
}[] = [
  { value: 'en', labelKey: 'common.languageEnglish' },
  { value: 'lt', labelKey: 'common.languageLithuanian' },
];

export function resolveAppLanguage(language: string): AppLanguage {
  return language === 'lt' ? 'lt' : 'en';
}
