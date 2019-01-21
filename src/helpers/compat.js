// required features check
const isGoodPrngAvailable = () => {
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

const compat = () => {
    if (navigator.cookieEnabled === false) {
        return 'Cookies are required to use ProtonMail. Please enable cookies in your browser.';
    }

    if (typeof Storage === 'undefined') {
        return 'sessionStorage is required to use ProtonMail. Please enable sessionStorage in your browser.';
    }

    if (!isGoodPrngAvailable()) {
        return 'A browser that has a Pseudo Random Number Generator is required to use ProtonMail. Please update your browser.';
    }
};

export const redirect = () => {
    window.location = 'https://protonmail.com/compatibility';
};

export const check = () => {
    const error = compat();
    if (error) {
        alert(error);
        return false;
    }

    return true;
};
