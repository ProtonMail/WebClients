import { c } from 'ttag';

import { getLanguageCode, getNormalizedLocale } from '@proton/shared/lib/i18n/helper';

export const DEFAULT_CAPTION_LANGUAGE = 'multi';

// Names shown in the target language so users spot theirs without knowing English.
// Codes must be in agents/src/session.rs::SUPPORTED_LANGUAGES; locales must be in the API's
// LiveCaptionsLocale enum, which only has region-qualified values, so region-less codes pick one.
const CAPTION_LANGUAGES: { code: string; name: string; locale: string }[] = [
    { code: 'ar', name: 'العربية', locale: 'ar_SA' },
    { code: 'zh', name: '中文 (简体)', locale: 'zh_CN' },
    { code: 'zh-TW', name: '中文 (繁體)', locale: 'zh_TW' },
    { code: 'nl', name: 'Nederlands', locale: 'nl_NL' },
    { code: 'en', name: 'English', locale: 'en_US' },
    { code: 'fr', name: 'Français', locale: 'fr_FR' },
    { code: 'de', name: 'Deutsch', locale: 'de_DE' },
    { code: 'hi', name: 'हिन्दी', locale: 'hi_IN' },
    { code: 'id', name: 'Bahasa Indonesia', locale: 'id_ID' },
    { code: 'it', name: 'Italiano', locale: 'it_IT' },
    { code: 'ja', name: '日本語', locale: 'ja_JP' },
    { code: 'ko', name: '한국어', locale: 'ko_KR' },
    { code: 'pl', name: 'Polski', locale: 'pl_PL' },
    { code: 'pt', name: 'Português', locale: 'pt_PT' },
    { code: 'pt-BR', name: 'Português (Brasil)', locale: 'pt_BR' },
    { code: 'ru', name: 'Русский', locale: 'ru_RU' },
    { code: 'es', name: 'Español', locale: 'es_ES' },
    { code: 'tr', name: 'Türkçe', locale: 'tr_TR' },
    { code: 'uk', name: 'Українська', locale: 'uk_UA' },
    { code: 'vi', name: 'Tiếng Việt', locale: 'vi_VN' },
];

export const getCaptionLanguageOptions = (): { value: string; label: string }[] => [
    { value: DEFAULT_CAPTION_LANGUAGE, label: c('Label').t`Auto-detect` },
    ...CAPTION_LANGUAGES.map(({ code, name }) => ({ value: code, label: name })),
];

/** The user settings store a locale, and null stands for auto-detect. */
export const getCaptionLocaleForLanguage = (language: string): string | null =>
    CAPTION_LANGUAGES.find(({ code }) => code === language)?.locale ?? null;

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
