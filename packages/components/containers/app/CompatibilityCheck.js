import React from 'react';
import { Href } from 'react-components';

const isGoodPrngAvailable = () => {
    if (window.crypto && window.crypto.getRandomValues) {
        return true;
    }
    return typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function';
};

// Locale is not loaded here so no translations
const compats = [
    {
        name: 'Cookies',
        valid: navigator.cookieEnabled === true,
        text: 'Please enable cookies in your browser.'
    },
    {
        name: 'Storage',
        valid: typeof sessionStorage !== 'undefined',
        text: 'Please enable sessionStorage in your browser.'
    },
    {
        name: 'PRNG',
        valid: isGoodPrngAvailable(),
        text: 'Please update to a modern browser with support for PRNG.'
    }
];

const notCompat = compats.some(({ valid }) => !valid);

const CompatibilityCheck = ({ children }) => {
    if (notCompat) {
        const list = compats
            .filter(({ valid }) => !valid)
            .map(({ name, text }, i) => {
                return (
                    <li key={i}>
                        {name}: {text}
                    </li>
                );
            });
        return (
            <>
                <h1>Compatibility Check</h1>
                <p>
                    ProtonMail requires a modern web browser with cutting edge support for{' '}
                    <Href href="http://caniuse.com/#feat=cryptography">WebCrypto (PRNG)</Href> and{' '}
                    <Href href="http://caniuse.com/#feat=namevalue-storage">Web Storage</Href>.
                </p>
                <ul>{list}</ul>
            </>
        );
    }

    return children;
};

export default CompatibilityCheck;
