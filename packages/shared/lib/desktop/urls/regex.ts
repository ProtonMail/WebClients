import { escapeRegex } from '../../helpers/regex';

/**
 * Matches the authority of a Proton app for the given subdomain(s), across environments.
 * e.g. `mail` matches `https://mail.proton.me`, `https://mail.proton.black`,
 * `https://mail.local.proton.dev`, `https://mail.proton.me:8443`, ...
 */
export const buildProtonHostnamePattern = (subdomains: string | string[]): string => {
    const list = Array.isArray(subdomains) ? subdomains : [subdomains];
    const escaped = list.map(escapeRegex).join('|');
    const subdomain = list.length > 1 ? `(?:${escaped})` : escaped;
    return `https?:\\/\\/${subdomain}\\.(?:[\\w-]+\\.)*proton\\.[\\w-]+(?::\\d+)?`;
};

/**
 * Matches any authority whose hostname contains the given needle,
 *
 * @example
 * `zoom` matches `https://us05web.zoom.us`.
 */
export const buildHostnameIncludesPattern = (needle: string): string => {
    return `https?:\\/\\/[^\\/]*${escapeRegex(needle)}[^\\/]*`;
};

/** Any path, including the root `/`. */
export const anyPathPattern = (): string => `(?:\\/.*)?`;

/** Path equal to `value`, with an optional trailing slash (e.g. `/close-ticket`). */
export const exactPathPattern = (value: string): string => `${escapeRegex(value)}\\/?`;

/** Path starting with `value` (e.g. `/born-private`, `/born-private/foo`). */
export const prefixPathPattern = (value: string): string => `${escapeRegex(value)}.*`;

/** Path containing `value` anywhere (e.g. `/u/0/lite`). */
export const includesPathPattern = (value: string): string => `.*${escapeRegex(value)}.*`;
