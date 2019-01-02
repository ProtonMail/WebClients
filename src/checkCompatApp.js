(function() {
    'use strict';

    function redirect() {
        window.location = 'https://protonmail.com/compatibility';
    }

    // required features check
    function isGoodPrngAvailable() {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            return true;
        } else if (
            typeof window !== 'undefined' &&
            typeof window.msCrypto === 'object' &&
            typeof window.msCrypto.getRandomValues === 'function'
        ) {
            return true;
        }
        return false;
    }

    if (navigator.cookieEnabled === false) {
        alert('Cookies are required to use ProtonMail. Please enable cookies in your browser.');
        redirect();
    }

    if (typeof Storage === 'undefined') {
        alert('sessionStorage is required to use ProtonMail. Please enable sessionStorage in your browser.');
        redirect();
    }
    if (!isGoodPrngAvailable()) {
        alert(
            'A browser that has a Pseudo Random Number Generator is required to use ProtonMail. Please update your browser.'
        );
        redirect();
    }
})();
