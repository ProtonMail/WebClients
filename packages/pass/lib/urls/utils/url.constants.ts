export const MAX_HOSTNAME_LENGTH = 253;

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

export const UNSUPPORTED_SCHEMES_REGEX = new RegExp(`^(${UNSUPPORTED_SCHEMES.join('|')})`, 'i');

/** Reference: https://urlregex.com */
export const RegexURL =
    /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

export const isValidURLScheme = (url?: URL): url is URL =>
    url !== undefined && !UNSUPPORTED_SCHEMES.includes(url.protocol);
