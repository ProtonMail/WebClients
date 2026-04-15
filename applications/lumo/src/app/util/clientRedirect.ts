import { REDIRECT_CONFIG } from './redirectConfig';

/**
 * Specific legacy marketing pages that should redirect to new proton.me URLs.
 * Only these exact paths will be redirected - all others stay on lumo domain.
 */
const LEGACY_MARKETING_PAGES: Record<string, string> = {
    '/about': '/lumo',
    '/business': '/business/lumo',
    '/legal/terms': '/lumo/terms',
    '/legal/privacy': '/lumo/privacy-policy',
    '/black-friday': 'lumo/black-friday',
    '/download': 'lumo/download',
};

/**
 * Supported locales on lumo.proton.me that should be preserved in redirects.
 * English (en) is the default and has no path prefix.
 * These match exactly with the languages available on the site.
 */
const SUPPORTED_LOCALES = new Set([
    'cs',
    'da',
    'de',
    'es-419',
    'es-es',
    'fi',
    'fr',
    'it',
    'ja',
    'ko',
    'nl',
    'nb',
    'pl',
    'pt',
    'pt-br',
    'ro',
    'ru',
    'sv',
    'tr',
    'zh-tw',
]);

/**
 * Parses a pathname to extract locale and page path.
 * Only recognizes officially supported locales from lumo.proton.me.
 * If an unsupported locale is detected, it's stripped and treated as English.
 * Examples:
 * - '/about' -> { locale: '', pagePath: '/about' }
 * - '/fr/about' -> { locale: '/fr', pagePath: '/about' } (supported)
 * - '/es-419/business' -> { locale: '/es-419', pagePath: '/business' } (supported)
 * - '/de/legal/terms' -> { locale: '/de', pagePath: '/legal/terms' } (supported)
 * - '/pt-br/legal/privacy' -> { locale: '/pt-br', pagePath: '/legal/privacy' } (supported)
 * - '/xx/about' -> { locale: '', pagePath: '/about' } (unsupported locale stripped)
 * - '/invalid/about' -> { locale: '', pagePath: '/invalid/about' } (doesn't look like locale)
 */
const parseLocalePath = (pathname: string): { locale: string; pagePath: string } => {
    const pathSegments = pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
        return { locale: '', pagePath: '/' };
    }

    const firstSegment = pathSegments[0];

    // Check if first segment is a supported locale
    const isValidLocale = SUPPORTED_LOCALES.has(firstSegment);

    if (isValidLocale) {
        const locale = `/${firstSegment}`;
        const pagePath = '/' + pathSegments.slice(1).join('/');
        return { locale, pagePath: pagePath === '/' ? '/' : pagePath };
    }

    // Check if first segment looks like a locale (2-5 chars, may contain hyphen)
    // If it looks like a locale but isn't supported, strip it and treat as English
    const looksLikeLocale = /^[a-z]{2}(-[a-z0-9]{2,4})?$/i.test(firstSegment);

    if (looksLikeLocale) {
        // Unsupported locale - strip it and use English (no locale prefix)
        const pagePath = '/' + pathSegments.slice(1).join('/');
        return { locale: '', pagePath: pagePath === '/' ? '/' : pagePath };
    }

    // First segment doesn't look like a locale, treat entire path as page path
    return { locale: '', pagePath: pathname };
};

/**
 * Performs client-side redirect from old lumo.proton.me URLs to new proton.me URLs.
 *
 * IMPORTANT: This is a temporary client-side solution.
 *
 * @returns true if a redirect was performed, false otherwise
 */
export const handleLegacyUrlRedirect = (): boolean => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
        return false;
    }

    const { hostname, pathname, search, hash } = window.location;

    // Only redirect if we're on one of the configured source domains
    if (!(REDIRECT_CONFIG.SOURCE_DOMAINS as readonly string[]).includes(hostname)) {
        return false;
    }

    // Parse the pathname to extract locale and page path
    const { locale, pagePath } = parseLocalePath(pathname);

    // Only redirect specific legacy marketing pages
    const newPath = LEGACY_MARKETING_PAGES[pagePath];
    if (!newPath) {
        return false;
    }

    try {
        const fullNewPath = `${locale}${newPath}`;
        const newUrl = `${REDIRECT_CONFIG.TARGET_DOMAIN}${fullNewPath}${search}${hash}`;

        window.location.replace(newUrl);

        // Return true to indicate redirect was performed
        return true;
    } catch (error) {
        console.error('Error during client redirect:', error);
        return false;
    }
};
