import punycode from 'punycode.js';

import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';

export const isSubDomain = (hostname: string, domain: string) => {
    if (hostname === domain) {
        return true;
    }

    return hostname.endsWith(`.${domain}`);
};

export const getHostname = (url: string) => {
    // The easy way to parse an URL, is to create <a> element.
    // @see: https://gist.github.com/jlong/2428561
    const parser = document.createElement('a');
    parser.href = url;
    return parser.hostname;
};

export const isMailTo = (url: string): boolean => {
    return url.toLowerCase().startsWith('mailto:');
};

export const isExternal = (url: string, hostname: string) => {
    try {
        return hostname !== getHostname(url) && !isMailTo(url);
    } catch (e: any) {
        /*
         * IE11/Edge are the worst, they crash when they try to parse
         * ex: http://xn--rotonmail-4sg.com
         * so if it does we know it's an external link (⌐■_■)
         */
        return true;
    }
};

export const isURLProtonInternal = (url: string, hostname: string) => {
    const currentDomain = getSecondLevelDomain(hostname);
    const targetOriginHostname = getHostname(url);

    // Still need to check the current domain otherwise it would not work on proton.local, localhost, etc...
    return ['protonmail.com', currentDomain]
        .filter(isTruthy)
        .some((domain) => isSubDomain(targetOriginHostname, domain));
};

/**
 * Force URL to display punycode
 * Punycode is a special encoding used to convert Unicode characters to ASCII, which is a smaller, restricted character set. Punycode is used to encode internationalized domain names (IDN).
 * Explanation about the potential attack: https://www.xudongz.com/blog/2017/idn-phishing/
 */
export const punycodeUrl = (url: string) => {
    const hasTrailingSlash = url.endsWith('/');
    const { protocol, hostname, pathname, search, hash, port } = new URL(url);
    const punycodeHostname = punycode.toASCII(hostname); // Even if modern browsers support IDN, we still need to convert it to punycode for old browsers
    const cleanPathname = search || hash ? pathname : pathname.replace(/\/$/, ''); // Remove trailing slash if no search or hash after
    const cleanedURL = `${protocol}//${punycodeHostname}${port ? `:${port}` : ''}${cleanPathname}${search}${hash}`;

    return cleanedURL.endsWith('/') ? cleanedURL : `${cleanedURL}${hasTrailingSlash ? '/' : ''}`;
};
