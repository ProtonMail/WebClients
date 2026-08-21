import safeRegex from 'safe-regex2';

import type { MaybeNull } from '@proton/pass/types';
import { dynMemo } from '@proton/pass/utils/fp/memo';

import type { ParsedUrl, URLComponents } from '../types';
import { sanitizeURL } from './sanitize';
import { UNSUPPORTED_SCHEMES_REGEX } from './url.constants';

export {
    MAX_HOSTNAME_LENGTH,
    RegexURL,
    UNSUPPORTED_SCHEMES,
    UNSUPPORTED_SCHEMES_REGEX,
    isValidURLScheme,
} from './url.constants';

export const URL_COMPONENTS = ['domain', 'port', 'protocol'] as const;

export const isTotpUri = (maybeUri: string): boolean => maybeUri.startsWith('otpauth://');

export const isValidScheme = (url: string) => !UNSUPPORTED_SCHEMES_REGEX.test(url.trim());

export const urlEq = (a: URLComponents, b: URLComponents) => URL_COMPONENTS.every((key) => a[key] === b[key]);

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

export const intoDomainWithPort = ({
    domain,
    port,
    protocol,
    as = 'href',
}: URLComponents & { as?: 'href' | 'host' }): MaybeNull<string> => {
    if (!(domain && protocol)) return null;

    try {
        const url = new URL(`${protocol}//${domain}`);
        if (port) url.port = port;

        return url[as];
    } catch {
        return null;
    }
};

/** Memoized converter from glob patterns to compiled regex */
export const globToRegExp = dynMemo((globPattern: string) => {
    const regexString = globPattern
        // Escape all regex special chars
        .replace(/[.+^${}()|[\]\\?]/g, '\\$&')
        // Replace wildcards with regex equivalent
        .replace(/\*/g, '.*');
    return new RegExp(`^${regexString}$`);
});

/** Memoized converter from URL glob patterns to compiled regex.
 * * matches within a segment (does not cross . or /), ** matches across separators. */
export const urlGlobToRegExp = dynMemo((globPattern: string) => {
    const regexString = globPattern
        // Escape all regex special chars
        .replace(/[.+^${}()|[\]\\?]/g, '\\$&')
        // Stash ** before touching single * to avoid conflict
        .replace(/\*\*/g, '\x00')
        // Single * does not cross separators
        .replace(/\*/g, '[^.\\/]*')
        // ** crosses any separator
        .replace(/\x00/g, '.*');
    return new RegExp(`^${regexString}$`);
});

/** Memoized compiler for user-supplied regex patterns.
 * Returns null if the pattern is unsafe (ReDoS-prone) or invalid. */
export const safeRegExpFromPattern = dynMemo((pattern: string): MaybeNull<RegExp> => {
    if (!safeRegex(pattern)) return null;
    try {
        return new RegExp(pattern, 'i');
    } catch {
        return null;
    }
});

export const resolveSubdomain = ({ domain, subdomain, hostname }: ParsedUrl): MaybeNull<string> =>
    subdomain ?? domain ?? hostname;

export const resolveDomain = ({ domain, hostname }: ParsedUrl): MaybeNull<string> => domain ?? hostname;

export const domainEndsWith = (domain: string, part: string) =>
    domain.endsWith(part) && (domain.length === part.length || domain.charAt(domain.length - part.length - 1) === '.');
