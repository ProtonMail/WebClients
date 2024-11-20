export const isWebCryptoAvailable = () => {
    // OpenPGP.js v6 will throw if the WebCrypto API is not available
    return !!window.crypto?.subtle;
};

export const isGoodPrngAvailable = () => {
    return !!window.crypto?.getRandomValues;
};

export const isBigIntSupported = () => {
    try {
        // The Palemoon browser v32.4.0.x supports BigInts but not increment/decrements;
        // We check support for these operations to avoid unexpected errors in e.g. OpenPGP.js, pmcrypto and the KT VRF.
        let check = BigInt('0x1'); // eslint-disable-line @typescript-eslint/no-unused-vars
        check--; // eslint-disable-line @typescript-eslint/no-unused-vars
        return true;
    } catch {
        return false;
    }
};
export const isWebCryptoRsaSigningSupported = async () => {
    // RSA PKCS#1 v1.5 is used for OpenPGP RSA signatures.
    const jwkPublicKey = {
        alg: 'RS1', // old signatures use SHA-1, so we check support for that specifically
        e: 'AQAB',
        kty: 'RSA',
        n: 'rVMOV0fT7doXOgDU-drrk9yXIgEsB9aK5x9fSOpRuWa8aS9hmX9obPoOub1Boz0Rk_C4maZMKo8m7mHx3-JnAyM24exthTD4lQ30d_84Uz_RzsMuBf8Mbg5zkkpoX-W_HLx1X7gcFtTsquUdhzk8eGdi5bOh61BDObUZO2X48B8k8aPFI8ZUvHXgYdgZaGdUkn55UKey4JxNCqRmI-WLczG6q4unRKcbez1AgtgiskJhB3G70YWBEcXV9zWLX6gvFpZ7ZNL2rrPvcuJYRXf394CI3lNrSGlcvtPrkggpiH13n8HKaWBBpcajcit2EAHN0jvV3GTBEoVsSoWl5A9lcQ',
    };
    try {
        const importedKey = await window.crypto.subtle.importKey(
            'jwk',
            jwkPublicKey,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-1' },
            false,
            ['verify']
        );
        return !!importedKey;
    } catch {
        return false;
    }
};
