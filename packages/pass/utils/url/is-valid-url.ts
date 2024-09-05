import type { MaybeNull } from '@proton/pass/types';

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

        /* invalidate if contains white-space after sanitization */
        const url = (scheme ? `${scheme}//${maybeUrl}` : maybeUrl).trim();
        if (/\s/.test(url)) return { valid: false, protocol: null, hostname: null, url };

        /* will throw a TypeError on invalid URL */
        const urlObj = new URL(url);

        /* if scheme is unsupported for our use-case */
        if (!isValidScheme(urlObj)) return { valid: false, hostname: null, protocol: null, url };

        const { protocol, hostname, href } = urlObj;
        return { valid: Boolean(RegexURL.test(urlObj.href)), hostname, protocol, url: href };
    } catch (_) {
        const startsWithHttpProtocol = /^https?:\/\//.test(maybeUrl);
        return scheme === undefined && !startsWithHttpProtocol
            ? isValidURL(maybeUrl, 'https:')
            : { valid: false, hostname: null, protocol: null, url: maybeUrl };
    }
};
