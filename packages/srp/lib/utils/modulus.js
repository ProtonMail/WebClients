import { getKeys, getCleartextMessage, binaryStringToArray, decodeBase64, verifyMessage } from 'pmcrypto';

import { VERIFICATION_STATUS, SRP_MODULUS_KEY } from '../constants';

const { NOT_SIGNED, SIGNED_AND_VALID } = VERIFICATION_STATUS;

/**
 * Get modulus keys.
 * @return {Promise}
 */
export const getModulusKeys = (() => {
    let cachedPromise;

    const get = async () => {
        try {
            cachedPromise = getKeys(SRP_MODULUS_KEY);
            return await cachedPromise;
        } catch (e) {
            cachedPromise = undefined;
            throw e;
        }
    };

    return () => {
        if (cachedPromise) {
            return cachedPromise;
        }
        return get();
    };
})();

/**
 * Verify the modulus signature with the SRP public key
 * @param {Object} keys
 * @param {Object} modulus
 * @return {Promise}
 */
export const verifyModulus = async (keys, modulus) => {
    try {
        const { verified = NOT_SIGNED } = await verifyMessage({
            message: modulus,
            publicKeys: keys,
        });

        if (verified !== SIGNED_AND_VALID) {
            throw new Error();
        }
    } catch (e) {
        throw new Error('Unable to verify server identity');
    }
};

/**
 * Verify modulus from the API and get the value.
 * @param {String} modulus - Armored modulus string
 * @returns {Promise<Uint8Array>}
 */
export const verifyAndGetModulus = async (modulus) => {
    const [publicKeys, modulusParsed] = await Promise.all([getModulusKeys(), getCleartextMessage(modulus)]);
    await verifyModulus(publicKeys, modulusParsed);
    return binaryStringToArray(decodeBase64(modulusParsed.getText()));
};
