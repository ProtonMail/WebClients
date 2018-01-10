import _ from 'lodash';

/* @ngInject */
function aboutClient() {
    const hasSessionStorage = () => {
        const mod = 'modernizr';
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch (error) {
            return false;
        }
    };
    const hasCookie = () => navigator.cookieEnabled;
    const getBrowser = () => $.ua.browser;
    const getDevice = () => $.ua.device;

    const getOS = () => {
        const { name = 'other', version = '' } = $.ua.os;
        return { name, version };
    };
    const isSafari = () => {
        const browsers = ['Safari', 'Mobile Safari'];
        return _.includes(browsers, $.ua.browser.name);
    };
    const isSafariMobile = () => $.ua.browser.name === 'Mobile Safari';

    const isIE11 = () => $.ua.browser.name === 'IE' && $.ua.browser.major === '11';
    const isEdge = () => $.ua.browser.name === 'Edge';
    const isFirefox = () => $.ua.browser.name === 'Firefox';
    const isMac = () => getOS().name === 'Mac OS';

    const isFileSaverSupported = () => 'download' in document.createElement('a') || navigator.msSaveOrOpenBlob;

    const prngAvailable = () => {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            return true;
        } else if (typeof window !== 'undefined' && typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function') {
            return true;
        }

        return false;
    };

    const doNotTrack = () => {
        return navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes' || navigator.msDoNotTrack === '1' || window.doNotTrack === '1';
    };

    return {
        doNotTrack,
        hasSessionStorage,
        hasCookie,
        getOS,
        getBrowser,
        getDevice,
        isMac,
        isIE11,
        isEdge,
        isSafari,
        isFirefox,
        isSafariMobile,
        isFileSaverSupported,
        prngAvailable
    };
}
export default aboutClient;
