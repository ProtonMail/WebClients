import type { MaybeNull } from '@proton/pass/types';

import { sanitizeURL } from './sanitize';
import type { ParsedSenderUrl, ParsedUrl, URLComponents } from './types';

export const MAX_HOSTNAME_LENGTH = 253;
export const URL_COMPONENTS = ['domain', 'port', 'protocol'] as const;
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

/** Reference: https://urlregex.com */
export const RegexURL =
    /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

export const isTotpUri = (maybeUri: string): boolean => maybeUri.startsWith('otpauth://');

export const isValidScheme = (url?: URL): url is URL =>
    url !== undefined && !UNSUPPORTED_SCHEMES.includes(url.protocol);

export const urlEq = (a: URLComponents, b: URLComponents) => URL_COMPONENTS.every((key) => a[key] === b[key]);

export const isSupportedSenderUrl = (parsedUrl: ParsedUrl): parsedUrl is ParsedSenderUrl =>
    parsedUrl.domain !== null && parsedUrl.protocol !== null;

/** Converts a URL string into a clean lowercased
 * hostname removing any `www.` prefix */
export const intoCleanHostname = (maybeUrl: string): MaybeNull<string> => {
    const { valid, hostname } = sanitizeURL(maybeUrl);
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

export const intoDomainWithPort = ({ domain, port, protocol }: URLComponents): MaybeNull<string> => {
    if (!(domain && protocol)) return null;

    try {
        const url = new URL(`${protocol}//${domain}`);
        if (port) url.port = port;

        return url.href;
    } catch {
        return null;
    }
};

export const globToRegExp = (globPattern: string) => {
    const regexString = globPattern.replace(/\//g, '\\/').replace(/\./g, '\\.').replace(/\*/g, '.*');
    return new RegExp(`^${regexString}$`);
};
