const endings = ['/', ':', '?', '#'];
const starters = ['.', '/', '@'];

/**
 * Extract domain name from an URL
 * From https://github.com/bjarneo/extract-domain
 * @param {String} url
 * @returns {String} domain
 */
export const getDomain = (url) => {
    if (typeof url !== 'string') {
        throw new TypeError('The given URL is not a string. Please verify your string.');
    }

    let domainInc = 0;
    let offsetDomain = 0;
    let offsetStartSlice = 0;
    let offsetPath = 0;
    let len = url.length;
    let i = 0;

    // Find end offset of domain
    while (len-- && ++i) {
        if (domainInc && endings.indexOf(url[i]) > -1) {
            break;
        }

        if (url[i] !== '.') {
            // eslint-disable-next-line no-continue
            continue;
        }

        ++domainInc;

        offsetDomain = i;
    }

    offsetPath = i;

    i = offsetDomain;

    // Find offset before domain name.
    while (i--) {
        // Look for sub domain, protocol or basic auth
        if (starters.indexOf(url[i]) === -1) {
            // eslint-disable-next-line no-continue
            continue;
        }

        offsetStartSlice = i + 1;

        break;
    }

    // offsetStartSlice should always be larger than protocol
    if (offsetStartSlice < 2) {
        return '';
    }

    // Tried several approaches slicing a string. Can't get it any faster than this.
    return url.slice(offsetStartSlice, offsetPath);
};

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

export const isExternal = (url) => window.location.hostname !== getHostname(url);
