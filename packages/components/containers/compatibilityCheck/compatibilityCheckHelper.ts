import type { ReactNode } from 'react';

import { isBigIntSupported, isGoodPrngAvailable, isWebCryptoAvailable } from '@proton/crypto/lib/compatibilityChecks';
import { isFirefoxWithBrokenX25519Support } from '@proton/shared/lib/helpers/browser';

export type CompatibilityItem = {
    name: string;
    valid: boolean;
    text: ReactNode;
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
            name: 'WebCrypto API',
            valid: isSSR || isWebCryptoAvailable(),
            text: 'Please update to a modern browser with support for the WebCrypto API.',
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
        {
            name: 'isFirefoxWithBrokenX25519Support',
            valid: !isFirefoxWithBrokenX25519Support(),
            text: 'This version of Firefox is no longer supported due to a bug in the  WebCrypto API. Please update to a newer version.',
        },
        ...compatibilities,
    ];
};
