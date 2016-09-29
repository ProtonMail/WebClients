angular.module("proton.webcrypto", [])
.factory('webcrypto', function() {
    if (window.crypto && window.crypto.getRandomValues) {
        return window.crypto;
    } else if (window.msCrypto && window.msCrypto.getRandomValues) {
        return window.msCrypto;
    } else {
        return {
            getRandomValues: function() {
                throw new Exception("No cryptographic randomness!");
            }
        };
    }
});
