import type { MaybeNull } from '@proton/pass/types';

export const MAX_HOSTNAME_LENGTH = 253;

const RegexURL =
    /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

export const UNSUPPORTED_SCHEMES = [
    'file:',
    'javascript:',
    'data:',
    'chrome-extension:',
    'chrome:',
    'brave:',
    'edge:',
    'moz-extension:',
    'about:',
];

export const isValidScheme = (url?: URL): url is URL =>
    url !== undefined && !UNSUPPORTED_SCHEMES.includes(url.protocol);

type UrlValidationResult = {
    valid: boolean;
    hostname: MaybeNull<string>;
    protocol: MaybeNull<string>;
    url: string;
};

/* Will first try to validate against the URL constructor.
 * If it fails, try to append https:// scheme and revalidate
 * Final step is to test against a URL regex (https://urlregex.com/) */
export const isValidURL = (maybeUrl: string, scheme?: string): UrlValidationResult => {
    try {
        if (!maybeUrl) return { valid: false, protocol: null, hostname: null, url: maybeUrl };

        const url = (scheme ? `${scheme}//${maybeUrl}` : maybeUrl).trim();
        /* invalidate if contains white-space after sanitization */
        if (/\s/.test(url)) return { valid: false, protocol: null, hostname: null, url };

        /* will throw a TypeError on invalid URL */
        const urlObj = new URL(url);

        /* if scheme is unsupported for our use-case */
        if (!isValidScheme(urlObj)) return { valid: false, hostname: null, protocol: null, url };

        const { protocol, hostname, href } = urlObj;
        const valid = hostname.length <= MAX_HOSTNAME_LENGTH && Boolean(RegexURL.test(urlObj.href));
        return { valid, hostname, protocol, url: href };
    } catch (_) {
        const startsWithHttpProtocol = /^https?:\/\//.test(maybeUrl);
        return scheme === undefined && !startsWithHttpProtocol
            ? isValidURL(maybeUrl, 'https:')
            : { valid: false, hostname: null, protocol: null, url: maybeUrl };
    }
};

/** Converts a URL string into a clean lowercased
 * hostname removing any `www.` prefix */
export const intoCleanHostname = (maybeUrl: string): MaybeNull<string> => {
    const { valid, hostname } = isValidURL(maybeUrl);
    if (!(valid && hostname)) return null;

    return hostname.replace(/^www\./i, '').toLowerCase();
};

/** Processes a URL into a domain name suitable for image URL generation.
 * Filters out specific types of domains and IP addresses. */
export const intoDomainImageHostname = (maybeUrl: string): MaybeNull<string> => {
    const hostname = intoCleanHostname(maybeUrl);
    if (!hostname) return null;

    /* Exclude empty domain URLs */
    if (hostname.indexOf('.') === -1) return null;
    /* Exclude common non-ICANN domains */
    if (/(\.?arpa|\.?onion|\.?local|\.?example(\.(com|org|net))?)$/.test(hostname)) return null;
    /* Quick check for IP address endings */
    if (/\.\d+$/.test(hostname)) return null;

    return hostname;
};
