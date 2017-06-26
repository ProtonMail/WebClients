angular.module('proton.commons')
    .factory('aboutClient', () => {

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
        const getBrowser = () => $.ua.browser.name;
        const getBrowserVersion = () => $.ua.browser.version;

        const isSafari = () => {
            const browsers = ['Safari', 'Mobile Safari'];
            return _.contains(browsers, $.ua.browser.name);
        };
        const isSafariMobile = () => $.ua.browser.name === 'Mobile Safari';

        const isIE11 = () => $.ua.browser.name === 'IE' && $.ua.browser.major === '11';
        const isEdge = () => $.ua.browser.name === 'Edge';
        const isFirefox = () => $.ua.browser.name === 'Firefox';

        const isFileSaverSupported = () => 'download' in document.createElement('a') || navigator.msSaveOrOpenBlob;

        const prngAvailable = () => {
            if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
                return true;
            } else if (typeof window !== 'undefined' && typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function') {
                return true;
            }

            return false;
        };

        const getOS = () => {
            let OSName = 'other'; // Unknown OS

            if (navigator.appVersion) {
                if (navigator.appVersion.indexOf('Win') !== -1) {
                    OSName = 'windows';
                }

                if (navigator.appVersion.indexOf('Mac') !== -1) {
                    OSName = 'osx';
                }

                if (navigator.appVersion.indexOf('X11') !== -1) {
                    OSName = 'linux';
                }

                if (navigator.appVersion.indexOf('Linux') !== -1) {
                    OSName = 'linux';

                    if (navigator.appVersion.indexOf('Android') !== -1) {
                        OSName = 'android';
                    }
                }
            }

            if (navigator.userAgent && /(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
                OSName = 'ios';
            }

            return OSName;
        };

        return {
            hasSessionStorage,
            hasCookie,
            getOS,
            getBrowser,
            getBrowserVersion,
            isIE11,
            isEdge,
            isSafari,
            isFirefox,
            isSafariMobile,
            isFileSaverSupported,
            prngAvailable
        };
    });
