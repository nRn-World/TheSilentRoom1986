import type { ModeLanguage } from './modeText';

/** One place decides how numbers are written for each interface language. */
export const numberLocale = (language: ModeLanguage) => language === 'en' ? 'en-US' : language === 'da' ? 'da-DK' : 'sv-SE';
export const formatSteps = (steps: number, language: ModeLanguage) => steps.toLocaleString(numberLocale(language));
