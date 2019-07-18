import React from 'react';

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
        text: 'Please update your browser.'
    }
];

const notCompat = compats.some(({ valid }) => !valid);

const CompatibilityCheck = ({ children }) => {
    if (notCompat) {
        return compats.map(({ name, valid, text }, i) => {
            return (
                <div key={i}>
                    {name} {text} {valid ? 'ok' : 'nok'}
                </div>
            );
        });
    }

    return children;
};

export default CompatibilityCheck;
