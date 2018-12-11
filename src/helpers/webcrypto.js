export const getRandomValues = (buf) => {
    if (window.crypto && window.crypto.getRandomValues) {
        return window.crypto.getRandomValues(buf);
    }
    if (window.msCrypto && window.msCrypto.getRandomValues) {
        return window.msCrypto.getRandomValues(buf);
    }
    throw new Error('No cryptographic randomness!');
};
