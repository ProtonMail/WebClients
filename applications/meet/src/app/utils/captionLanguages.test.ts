import {
    DEFAULT_CAPTION_LANGUAGE,
    getCaptionLanguageForLocale,
    getCaptionLanguageOptions,
    getCaptionLocaleForLanguage,
    isSupportedCaptionLanguage,
} from './captionLanguages';

describe('getCaptionLanguageForLocale', () => {
    it('drops the region when the agent only transcribes the language', () => {
        expect(getCaptionLanguageForLocale('en_US')).toBe('en');
        expect(getCaptionLanguageForLocale('fr_CA')).toBe('fr');
    });

    it('keeps the region when the agent tells the variants apart', () => {
        expect(getCaptionLanguageForLocale('pt_BR')).toBe('pt-BR');
        expect(getCaptionLanguageForLocale('pt_PT')).toBe('pt');
        expect(getCaptionLanguageForLocale('zh_TW')).toBe('zh-TW');
        expect(getCaptionLanguageForLocale('zh_CN')).toBe('zh');
    });

    it('matches whatever separator and casing the locale is written in', () => {
        expect(getCaptionLanguageForLocale('en-GB')).toBe('en');
        expect(getCaptionLanguageForLocale('pt-br')).toBe('pt-BR');
    });

    it('falls back to auto-detect for a language the agent does not speak', () => {
        expect(getCaptionLanguageForLocale('cs_CZ')).toBe(DEFAULT_CAPTION_LANGUAGE);
        expect(getCaptionLanguageForLocale('')).toBe(DEFAULT_CAPTION_LANGUAGE);
    });
});

describe('getCaptionLocaleForLanguage', () => {
    it('picks a region for a language the settings only accept qualified', () => {
        expect(getCaptionLocaleForLanguage('fr')).toBe('fr_FR');
        expect(getCaptionLocaleForLanguage('en')).toBe('en_US');
    });

    it('keeps the region the user already picked', () => {
        expect(getCaptionLocaleForLanguage('pt-BR')).toBe('pt_BR');
        expect(getCaptionLocaleForLanguage('pt')).toBe('pt_PT');
        expect(getCaptionLocaleForLanguage('zh-TW')).toBe('zh_TW');
    });

    it('stores auto-detect as no locale at all', () => {
        expect(getCaptionLocaleForLanguage(DEFAULT_CAPTION_LANGUAGE)).toBeNull();
        expect(getCaptionLocaleForLanguage('cs')).toBeNull();
    });

    it('round-trips every offered language', () => {
        getCaptionLanguageOptions().forEach(({ value }) => {
            const locale = getCaptionLocaleForLanguage(value);

            expect(locale === null ? DEFAULT_CAPTION_LANGUAGE : getCaptionLanguageForLocale(locale)).toBe(value);
        });
    });
});

describe('isSupportedCaptionLanguage', () => {
    it('accepts the codes the select offers', () => {
        expect(isSupportedCaptionLanguage('pt-BR')).toBe(true);
        expect(isSupportedCaptionLanguage(DEFAULT_CAPTION_LANGUAGE)).toBe(true);
    });

    it('rejects anything else', () => {
        expect(isSupportedCaptionLanguage('pt_BR')).toBe(false);
        expect(isSupportedCaptionLanguage('')).toBe(false);
    });
});
