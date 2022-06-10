import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';

export const isSubDomain = (hostname: string, domain: string) => {
    if (hostname === domain) {
        return true;
    }

    return hostname.endsWith(`.${domain}`);
};

export const getHostname = (url: string) => {
    if (/^https?:\/\//.test(url)) {
        // Absolute URL.
        // The easy way to parse an URL, is to create <a> element.
        // @see: https://gist.github.com/jlong/2428561
        const parser = document.createElement('a');
        parser.href = url;
        return parser.hostname;
    }
    return window.location.hostname; // Relative URL.
};

export const isExternal = (url: string) => {
    try {
        return window.location.hostname !== getHostname(url);
    } catch (e: any) {
        /*
         * IE11/Edge are the worst, they crash when they try to parse
         * ex: http://xn--rotonmail-4sg.com
         * so if it does we know it's an external link (⌐■_■)
         */
        return true;
    }
};

export const isURLProtonInternal = (url: string) => {
    const currentDomain = getSecondLevelDomain(window.location.hostname);
    const targetOriginHostname = getHostname(url);

    // Still need to check the current domain otherwise it would not work on proton.local, localhost, etc...
    return ['protonmail.com', currentDomain]
        .filter(isTruthy)
        .some((domain) => isSubDomain(targetOriginHostname, domain));
};
