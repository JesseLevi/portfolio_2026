import { nl } from './nl';
import type { Dictionary, TranslationKey } from './nl';

// Engels later: voeg `en` toe aan deze map en 'en' aan `i18n.locales` in astro.config.mjs.
const dictionaries = { nl } satisfies Record<string, Dictionary>;

export type Locale = keyof typeof dictionaries;
export const defaultLocale: Locale = 'nl';

export function getLocale(currentLocale: string | undefined): Locale {
  return currentLocale && currentLocale in dictionaries
    ? (currentLocale as Locale)
    : defaultLocale;
}

export function t(key: TranslationKey, locale: Locale = defaultLocale): string {
  return dictionaries[locale][key];
}

export type { TranslationKey };
