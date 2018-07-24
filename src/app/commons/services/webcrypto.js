/* @ngInject */
function webcrypto() {
    if (window.crypto && window.crypto.getRandomValues) {
        return window.crypto;
    }

    if (window.msCrypto && window.msCrypto.getRandomValues) {
        return window.msCrypto;
    }

    return {
        getRandomValues() {
            throw new Error('No cryptographic randomness!');
        }
    };
}
export default webcrypto;
