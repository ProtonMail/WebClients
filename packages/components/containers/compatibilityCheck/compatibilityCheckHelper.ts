export type CompatibilityItem = { name: string; valid: boolean; text: string };

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
    } catch (e: any) {
        // Safari throws SecurityError if storage is disabled
        return false;
    }
};

const hasSessionStorage = () => {
    try {
        return !!window.sessionStorage;
    } catch (e: any) {
        // Safari throws SecurityError if storage is disabled
        return false;
    }
};

const hasLocalStorage = () => {
    try {
        return !!window.localStorage;
    } catch (e: any) {
        // Safari throws SecurityError if storage is disabled
        return false;
    }
};

const hasReplaceAll = () => {
    try {
        return 'a'.replaceAll('a', 'b') === 'b';
    } catch (e) {
        return false;
    }
};

const isBigIntSupported = () => {
    try {
        // The Palemoon browser v32.4.0.x supports BigInts but not increment/decrements;
        // We check support for these operations to avoid unexpected errors in e.g. the KT VRF.
        let check = BigInt('0x1'); // eslint-disable-line @typescript-eslint/no-unused-vars
        check--; // eslint-disable-line @typescript-eslint/no-unused-vars
        return true;
    } catch {
        return false;
    }
};

// Locale is not loaded here so no translations
export const getCompatibilityList = (compatibilities: CompatibilityItem[] = []): CompatibilityItem[] => {
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
        {
            name: 'BigInt',
            valid: isBigIntSupported(),
            text: 'Please update to a modern browser with BigInt support',
        },
        {
            name: 'ReplaceAll',
            valid: hasReplaceAll(),
            text: '',
        },
        ...compatibilities,
    ];
};
