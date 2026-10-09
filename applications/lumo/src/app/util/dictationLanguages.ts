export const DICTATION_LANGUAGE_AUTO = 'auto';

/** Languages supported by the realtime transcription model (ISO codes as expected by the API). */
export const DICTATION_LANGUAGE_CODES = [
    'zh',
    'en',
    'yue',
    'ar',
    'de',
    'fr',
    'es',
    'pt',
    'id',
    'it',
    'ko',
    'ru',
    'th',
    'vi',
    'ja',
    'tr',
    'hi',
    'ms',
    'nl',
    'sv',
    'da',
    'fi',
    'pl',
    'cs',
    'fil',
    'fa',
    'el',
    'hu',
    'mk',
    'ro',
] as const;

type DictationLanguageCode = (typeof DICTATION_LANGUAGE_CODES)[number];
/** Either a supported language code or "auto" (let the model detect the language). */
export type DictationLanguage = DictationLanguageCode | typeof DICTATION_LANGUAGE_AUTO;

export const isDictationLanguage = (value: unknown): value is DictationLanguage =>
    value === DICTATION_LANGUAGE_AUTO || (DICTATION_LANGUAGE_CODES as readonly string[]).includes(value as string);

/** Returns the supported language matching the browser locale (e.g. "nl-BE" -> "nl"), or "auto". */
export const getDefaultDictationLanguage = (locale?: string): DictationLanguage => {
    const candidates = locale ? [locale] : typeof navigator !== 'undefined' ? [...(navigator.languages ?? [])] : [];
    for (const candidate of candidates) {
        const lower = candidate.toLowerCase();
        // Cantonese has its own code; Chinese locales otherwise map to "zh".
        if (lower === 'yue' || lower.startsWith('yue-') || lower === 'zh-hk') {
            return 'yue';
        }
        const base = lower.split(/[-_]/)[0];
        if (base === 'tl') {
            return 'fil';
        }
        if (isDictationLanguage(base) && base !== DICTATION_LANGUAGE_AUTO) {
            return base;
        }
    }
    return DICTATION_LANGUAGE_AUTO;
};

/** Localized display name for a language code, falling back to the code itself. */
export const getDictationLanguageName = (code: string, displayLocale?: string): string => {
    try {
        const names = new Intl.DisplayNames(displayLocale ? [displayLocale] : undefined, { type: 'language' });
        return names.of(code) ?? code;
    } catch {
        return code;
    }
};
