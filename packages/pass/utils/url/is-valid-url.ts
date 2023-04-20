const RegexURL =
    /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

export const UNSUPPORTED_SCHEMES = [
    'file:',
    'javascript:',
    'data:',
    'chrome-extension:',
    'chrome:',
    'brave:',
    'moz-extension:',
    'about:',
];

export const isValidScheme = (url?: URL): url is URL =>
    url !== undefined && !UNSUPPORTED_SCHEMES.includes(url.protocol);

/* Will first try to validate against the URL constructor.
 * If it fails, try to append https:// scheme and revalidate
 * Final step is to test against a URL regex (https://urlregex.com/) */
export const isValidURL = (maybeUrl: string, scheme?: string): { valid: boolean; url: string } => {
    try {
        const url = `${scheme ?? ''}${maybeUrl}`.trim();

        /* invalidate if contains white-space after sanitization */
        if (/\s/.test(url)) return { valid: false, url };

        /* will throw a TypeError on invalid URL */
        const urlObj = new URL(url);

        /* if scheme is unsupported for our use-case */
        if (!isValidScheme(urlObj)) return { valid: false, url };

        return { valid: Boolean(RegexURL.test(urlObj.href)), url: urlObj.href };
    } catch (_) {
        return scheme === undefined ? isValidURL(maybeUrl, 'https://') : { valid: false, url: maybeUrl };
    }
};
