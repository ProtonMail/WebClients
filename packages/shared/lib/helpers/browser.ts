import { UAParser } from 'ua-parser-js';

const uaParser = new UAParser();
const ua = uaParser.getResult();

export const hasModulesSupport = () => {
    const script = document.createElement('script');
    return 'noModule' in script;
};

export const isFileSaverSupported = () => !!new Blob();

export const textToClipboard = (text = '') => {
    const dummy = document.createElement('textarea');

    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
};

export const getOS = () => {
    const { name = 'other', version = '' } = ua.os;
    return { name, version };
};

export const isDuckDuckGo = () => navigator.userAgent.includes('DuckDuckGo');
export const isSafari = () => ua.browser.name === 'Safari' || ua.browser.name === 'Mobile Safari';
export const isSafariMobile = () => ua.browser.name === 'Mobile Safari';
export const isIE11 = () => ua.browser.name === 'IE' && ua.browser.major === '11';
export const isEdge = () => ua.browser.name === 'Edge';
export const isEdgeChromium = () => isEdge() && ua.engine.name === 'Blink';
export const isFirefox = () => ua.browser.name === 'Firefox';
export const isChrome = () => ua.browser.name === 'Chrome';
export const isMac = () => ua.os.name === 'Mac OS';
export const isWindows = () => ua.os.name === 'Windows';
export const hasTouch = typeof document === 'undefined' ? false : 'ontouchstart' in document.documentElement;
export const hasCookie = () => navigator.cookieEnabled;
export const getBrowser = () => ua.browser;
export const getDevice = () => ua.device;
export const isMobile = () => {
    const { type } = getDevice();
    return type === 'mobile';
};
export const isDesktop = () => {
    const { type } = getDevice();
    return !type;
};

export const doNotTrack = () => {
    return navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes' || window.doNotTrack === '1';
};

/**
 * Do not support window.open event after user interaction
 */
export const doNotWindowOpen = () => {
    return isDuckDuckGo();
};

export const parseURL = (url = '') => {
    const parser = document.createElement('a');
    const searchObject: { [key: string]: any } = {};
    // Let the browser do the work
    parser.href = url;
    // Convert query string to object
    const queries = parser.search.replace(/^\?/, '').split('&');

    for (let i = 0; i < queries.length; i++) {
        const [key, value] = queries[i].split('=');
        searchObject[key] = value;
    }

    return {
        protocol: parser.protocol,
        host: parser.host,
        hostname: parser.hostname,
        port: parser.port,
        pathname: parser.pathname,
        search: parser.search,
        searchObject,
        hash: parser.hash,
    };
};

export const getActiveXObject = (name: string) => {
    try {
        // @ts-expect-error
        // eslint-disable-next-line no-undef
        return new ActiveXObject(name);
    } catch (error) {
        return undefined;
    }
};

export const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
export const hasAcrobatInstalled = () => !!(getActiveXObject('AcroPDF.PDF') || getActiveXObject('PDF.PdfCtrl'));
export const hasPDFSupport = () => {
    return 'application/pdf' in navigator.mimeTypes || (isFirefox() && isDesktop()) || isIos() || hasAcrobatInstalled();
};
export const replaceUrl = (url = '') => document.location.replace(url);
export const redirectTo = (url = '') => replaceUrl(`${document.location.origin}${url}`);

/**
 * Detect browser requiring direct action
 * Like opening a new tab
 */
export const requireDirectAction = () => isSafari() || isFirefox() || isEdge();

/**
 * Open an URL inside a new tab/window and remove the referrer
 * @links { https://mathiasbynens.github.io/rel-noopener/}
 */
export const openNewTab = (url: string) => {
    if (isIE11() || isFirefox()) {
        const otherWindow = window.open();
        if (!otherWindow) {
            return;
        }
        otherWindow.opener = null;
        otherWindow.location.href = url;
        return;
    }
    const anchor = document.createElement('a');

    anchor.setAttribute('rel', 'noreferrer nofollow noopener');
    anchor.setAttribute('target', '_blank');
    anchor.href = url;

    return anchor.click();
};
