import type { SanitizedUrl } from '../types';
import { MAX_HOSTNAME_LENGTH, RegexURL, isValidURLScheme } from './url.constants';

/* Will first try to validate against the URL constructor.
 * If it fails, try to append https:// scheme and revalidate
 * Final step is to test against a URL regex (https://urlregex.com/) */
export const sanitizeURL = (maybeUrl: string, scheme?: string): SanitizedUrl => {
    try {
        if (!maybeUrl) {
            return { valid: false, protocol: null, port: null, hostname: null, url: maybeUrl, cleanUrl: null };
        }

        const url = (scheme ? `${scheme}//${maybeUrl}` : maybeUrl).trim();
        /* invalidate if contains white-space after sanitization */
        if (/\s/.test(url)) {
            return { valid: false, protocol: null, port: null, hostname: null, url: maybeUrl, cleanUrl: null };
        }

        /* will throw a TypeError on invalid URL */
        const urlObj = new URL(url);

        /* if scheme is unsupported for our use-case */
        if (!isValidURLScheme(urlObj)) {
            return { valid: false, hostname: null, protocol: null, port: null, url: maybeUrl, cleanUrl: null };
        }

        const { protocol, hostname, href, port, origin, pathname } = urlObj;
        const valid = hostname.length <= MAX_HOSTNAME_LENGTH && Boolean(RegexURL.test(urlObj.href));
        return { valid, hostname, protocol, port: port || null, url: href, cleanUrl: origin + pathname };
    } catch (_) {
        const startsWithHttpProtocol = /^https?:\/\//.test(maybeUrl);
        return scheme === undefined && !startsWithHttpProtocol
            ? sanitizeURL(maybeUrl, 'https:')
            : { valid: false, hostname: null, protocol: null, port: null, url: maybeUrl, cleanUrl: null };
    }
};
