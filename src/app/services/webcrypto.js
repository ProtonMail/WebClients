angular.module('proton.webcrypto', [])
.factory('webcrypto', () => {
    if (window.crypto && window.crypto.getRandomValues) {
        return window.crypto;
    } else if (window.msCrypto && window.msCrypto.getRandomValues) {
        return window.msCrypto;
    }

    return {
        getRandomValues() {
            throw new Error('No cryptographic randomness!');
        }
    };
});
