import { localeCode } from '@proton/shared/lib/i18n';

const MARKETING_BASE = 'https://proton.me';

/**
 * Maps Proton internal locale codes to the URL path slugs used on proton.me.
 * English (en_US) is the default and uses no prefix.
 * Slugs match the languages available on lumo.proton.me.
 */
const LOCALE_TO_MARKETING_SLUG: Record<string, string> = {
    cs_CZ: 'cs',
    da_DK: 'da',
    de_DE: 'de',
    es_ES: 'es-es',
    es_LA: 'es-419',
    fi_FI: 'fi',
    fr_FR: 'fr',
    it_IT: 'it',
    ja_JP: 'ja',
    ko_KR: 'ko',
    nb_NO: 'nb',
    nl_NL: 'nl',
    pl_PL: 'pl',
    pt_BR: 'pt-br',
    pt_PT: 'pt',
    ro_RO: 'ro',
    ru_RU: 'ru',
    sv_SE: 'sv',
    tr_TR: 'tr',
    zh_TW: 'zh-tw',
};

/**
 * Returns the locale path prefix for the current app locale (e.g. `/fr`, `/de`).
 * Returns an empty string for English (the default, no prefix).
 *
 * Reads `localeCode` at call time — safe to use inside render functions because
 * locale changes trigger a full app re-render via LocaleInjector / GuestApp bootstrap.
 */
export const getMarketingLocalePrefix = (): string => {
    const slug = LOCALE_TO_MARKETING_SLUG[localeCode];
    return slug ? `/${slug}` : '';
};

/**
 * Builds a locale-aware URL on proton.me.
 * @param path - Must start with `/`, e.g. `/lumo/terms`
 */
export const getMarketingUrl = (path: string): string => {
    return `${MARKETING_BASE}${getMarketingLocalePrefix()}${path}`;
};
