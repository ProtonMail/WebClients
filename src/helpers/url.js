import parseDomain from 'parse-domain';

const getHostname = (url) => {
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

export const isExternal = (url) => {
    try {
        return window.location.hostname !== getHostname(url);
    } catch (e) {
        /*
            IE11/Edge are the worst, they crash when they try to parse
            ex: http://xn--rotonmail-4sg.com
            so if it does we know it's an external link (⌐■_■)
         */
        return true;
    }
};

/**
 * Extract domain from URL
 * Wrap parseDomain to not break the process
 * If the URL is malformated we co
 * @param {String} url
 * @returns {String}
 */
export const getDomain = (url) => {
    try {
        // parseDomain can be null if the domain is invalid
        const { domain = '', tld = '' } = parseDomain(url) || {};
        return `${domain}.${tld}`;
    } catch (e) {
        return '';
    }
};
