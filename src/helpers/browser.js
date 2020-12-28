import '../app/vendorHelpers/jquery.loader';
import 'ua-parser-js/src/ua-parser';

export const hasSessionStorage = () => {
    const mod = 'modernizr';
    try {
        sessionStorage.setItem(mod, mod);
        sessionStorage.removeItem(mod);
        return true;
    } catch (error) {
        return false;
    }
};
export const hasCookie = () => navigator.cookieEnabled;
export const getBrowser = () => $.ua.browser;
export const getDevice = () => $.ua.device;
export const isMobile = () => {
    const { type } = getDevice();
    return type === 'mobile';
};

export const getOS = () => {
    const { name = 'other', version = '' } = $.ua.os;
    return { name, version };
};
export const isSafari = () => ['Safari', 'Mobile Safari'].includes($.ua.browser.name);
export const isSafariMobile = () => $.ua.browser.name === 'Mobile Safari';
export const isBrokenUploadSafari = () => {
    return isSafari() && ['14.0.1', '14.0.2'].includes($.ua.browser.version) && $.ua.os.version === '10.14.6';
};
export const isIE11 = () => $.ua.browser.name === 'IE' && $.ua.browser.major === '11';
export const isEdge = () => $.ua.browser.name === 'Edge';
export const isFirefox = () => $.ua.browser.name === 'Firefox';
export const isChrome = () => $.ua.browser.name === 'Chrome';
export const isMac = () => getOS().name === 'Mac OS';
export const hasTouch = 'ontouchstart' in document.documentElement;

export const isBrowserWithout3DS = () => {
    // Mozilla/5.0 (Linux; Android 9) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.108 Mobile Safari/537.36 DuckDuckGo/5
    const isDonald = navigator.userAgent.includes('DuckDuckGo');
    const isFFocus = $.ua.browser.name === 'Firefox Focus';

    return isFFocus || isDonald;
};

/**
 * If the browser supports script type="module"
 * @return {boolean}
 */
export const hasModulesSupport = () => {
    const script = document.createElement('script');
    return 'noModule' in script;
};

export const isFileSaverSupported = () => 'download' in document.createElement('a') || navigator.msSaveOrOpenBlob;

export const prngAvailable = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        return true;
    }
    if (
        typeof window !== 'undefined' &&
        typeof window.msCrypto === 'object' &&
        typeof window.msCrypto.getRandomValues === 'function'
    ) {
        return true;
    }

    return false;
};

export const doNotTrack = () => {
    return (
        navigator.doNotTrack === '1' ||
        navigator.doNotTrack === 'yes' ||
        navigator.msDoNotTrack === '1' ||
        window.doNotTrack === '1'
    );
};

/**
 * Open an URL inside a new tab/window and remove the referrer
 * @links { https://mathiasbynens.github.io/rel-noopener/}
 * @param  {String} url
 * @return {void}
 */
export function openWindow(url) {
    if (isIE11() || isFirefox()) {
        const win = window.open();
        win.opener = null;
        win.location = url;
        return;
    }
    const anchor = document.createElement('A');

    anchor.setAttribute('rel', 'noreferrer nofollow noopener');
    anchor.setAttribute('target', '_blank');
    anchor.href = url;

    return anchor.click();
}

const extractQueryParams = (input, parser) => {
    try {
        const url = new URL(input);

        return Array.from(url.searchParams.entries()).reduce((acc, [key, value = '']) => {
            const isBody = key === 'body';
            acc[key] = isBody ? value : value.replace(/\n/g, '');
            return acc;
        }, {});
    } catch (e) {
        // If no support - fallback
        return parser.search
            .replace(/\?/g, '')
            .split('&')
            .reduce((acc, query) => {
                const [key, value = ''] = query.split('=');
                const isBody = key === 'body';
                acc[key] = isBody ? value : value.replace(/\n/g, '');
                return acc;
            }, {});
    }
};

export const parseURL = (url = '') => {
    const parser = document.createElement('A');
    parser.href = url;

    return {
        protocol: parser.protocol,
        host: parser.host,
        hostname: parser.hostname,
        port: parser.port,
        pathname: parser.pathname,
        search: parser.search,
        searchObject: extractQueryParams(url, parser),
        hash: parser.hash
    };
};

const loadScriptHelper = ({ path, integrity }, cb) => {
    const script = document.createElement('script');

    script.src = path;
    if (integrity) {
        script.integrity = integrity;
    }
    script.onload = (e) => {
        cb(e);
        script.remove();
    };
    script.onerror = (e) => cb(undefined, e);

    document.head.appendChild(script);
};

export const loadScript = (path, integrity) => {
    return new Promise((resolve, reject) => {
        loadScriptHelper({ path, integrity }, (event, error) => {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
};

/**
 * Monkey-patch broken atob in IE11 as OpenPGP.js v4.10 requires it
 * Maybe for more browsers
 */
export function patchAtob() {
    try {
        window.atob(' ');
    } catch (e) {
        /* eslint-disable wrap-iife */
        window.atob = (function(atob) {
            return function(string) {
                return atob(String(string).replace(/[\t\n\f\r ]+/g, ''));
            };
        })(window.atob);
    }
}

export const getSecondLevelDomain = () => {
    const { hostname } = window.location;
    return hostname.substr(hostname.indexOf('.') + 1);
};

export const getCookie = (name, cookies = document.cookie) => {
    const result = `; ${cookies}`.match(`;\\s*${name}=([^;]+)`);
    if (result && result.length === 2) {
        return result[1];
    }
    return null;
};

export const setCookie = ({
    cookieName,
    cookieValue: maybeCookieValue,
    expirationDate: maybeExpirationDate,
    path,
    cookieDomain
}) => {
    const expirationDate = maybeCookieValue === undefined ? new Date(0).toUTCString() : maybeExpirationDate;
    const cookieValue = maybeCookieValue === undefined ? '' : maybeCookieValue;
    document.cookie = [
        `${cookieName}=${cookieValue}`,
        expirationDate && `expires=${expirationDate}`,
        cookieDomain && `domain=${cookieDomain}`,
        path && `path=${path}`
    ]
        .filter(Boolean)
        .join(';');
};
