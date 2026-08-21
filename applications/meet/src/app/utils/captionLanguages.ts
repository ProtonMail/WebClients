import { c } from 'ttag';

import { getLanguageCode, getNormalizedLocale } from '@proton/shared/lib/i18n/helper';

export const DEFAULT_CAPTION_LANGUAGE = 'multi';

// Names shown in the target language so users spot theirs without knowing English.
// Codes must be in agents/src/session.rs::SUPPORTED_LANGUAGES.
const CAPTION_LANGUAGES: { code: string; name: string }[] = [
    { code: 'ar', name: 'العربية' },
    { code: 'zh', name: '中文 (简体)' },
    { code: 'zh-TW', name: '中文 (繁體)' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'it', name: 'Italiano' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'pl', name: 'Polski' },
    { code: 'pt', name: 'Português' },
    { code: 'pt-BR', name: 'Português (Brasil)' },
    { code: 'ru', name: 'Русский' },
    { code: 'es', name: 'Español' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'uk', name: 'Українська' },
    { code: 'vi', name: 'Tiếng Việt' },
];

export const getCaptionLanguageOptions = (): { value: string; label: string }[] => [
    { value: DEFAULT_CAPTION_LANGUAGE, label: c('Label').t`Auto-detect` },
    ...CAPTION_LANGUAGES.map(({ code, name }) => ({ value: code, label: name })),
];

export const isSupportedCaptionLanguage = (language: string) =>
    language === DEFAULT_CAPTION_LANGUAGE || CAPTION_LANGUAGES.some(({ code }) => code === language);

export const getCaptionLanguageForLocale = (locale: string): string => {
    const normalizedLocale = getNormalizedLocale(locale);

    const regionMatch = CAPTION_LANGUAGES.find(({ code }) => getNormalizedLocale(code) === normalizedLocale);
    if (regionMatch) {
        return regionMatch.code;
    }

    const language = getLanguageCode(normalizedLocale);
    const languageMatch = CAPTION_LANGUAGES.find(({ code }) => getLanguageCode(code) === language);

    return languageMatch?.code ?? DEFAULT_CAPTION_LANGUAGE;
};
