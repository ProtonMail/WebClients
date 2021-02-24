const isGoodPrngAvailable = () => {
    if (window.crypto && !!window.crypto.getRandomValues) {
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function';
};

const hasCookies = () => {
    try {
        return navigator.cookieEnabled;
    } catch (e) {
        // Safari throws SecurityError if storage is disabled
        return false;
    }
};

const hasSessionStorage = () => {
    try {
        return !!window.sessionStorage;
    } catch (e) {
        // Safari throws SecurityError if storage is disabled
        return false;
    }
};

const hasLocalStorage = () => {
    try {
        return !!window.localStorage;
    } catch (e) {
        // Safari throws SecurityError if storage is disabled
        return false;
    }
};

// Locale is not loaded here so no translations
export const getCompatibilityList = () => {
    const isSSR = typeof window === 'undefined';
    return [
        {
            name: 'Cookies',
            valid: isSSR || hasCookies(),
            text: 'Please enable cookies in your browser.',
        },
        {
            name: 'Storage',
            valid: isSSR || hasSessionStorage(),
            text: 'Please enable sessionStorage in your browser.',
        },
        {
            name: 'Storage',
            valid: isSSR || hasLocalStorage(),
            text: 'Please enable localStorage in your browser.',
        },
        {
            name: 'PRNG',
            valid: isSSR || isGoodPrngAvailable(),
            text: 'Please update to a modern browser with support for PRNG.',
        },
    ];
};
