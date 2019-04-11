import UAParser from 'ua-parser-js';

const uaParser = new UAParser();
const ua = uaParser.getResult();

export const hasModulesSupport = () => {
    const script = document.createElement('script');
    return 'noModule' in script;
};

export const isFileSaverSupported = () => 'download' in document.createElement('a') || navigator.msSaveOrOpenBlob;

export const textToClipboard = (text) => {
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

export const isSafari = () => ['Safari', 'Mobile Safari'].includes(ua.browser.name);
export const isSafariMobile = () => ua.browser.name === 'Mobile Safari';
export const isIE11 = () => ua.browser.name === 'IE' && ua.browser.major === '11';
export const isEdge = () => ua.browser.name === 'Edge';
export const isFirefox = () => ua.browser.name === 'Firefox';
export const isChrome = () => ua.browser.name === 'Chrome';
export const isMac = () => ua.os.name === 'Mac OS';
export const hasTouch = 'ontouchstart' in document.documentElement;
export const hasCookie = () => navigator.cookieEnabled;
export const getBrowser = () => ua.browser;
export const getDevice = () => ua.device;
export const isMobile = () => {
    const { type } = getDevice();
    return type === 'mobile';
};

export const doNotTrack = () => {
    return (
        navigator.doNotTrack === '1' ||
        navigator.doNotTrack === 'yes' ||
        navigator.msDoNotTrack === '1' ||
        window.doNotTrack === '1'
    );
};

export const parseURL = (url = '') => {
    const parser = document.createElement('a');
    const searchObject = {};
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
        hash: parser.hash
    };
};
