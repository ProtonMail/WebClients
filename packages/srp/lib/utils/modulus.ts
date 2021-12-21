import {
    getKeys,
    // @ts-expect-error getCleartextMessage is not exported
    getCleartextMessage,
    createCleartextMessage,
    binaryStringToArray,
    decodeBase64,
    verifyMessage,
    OpenPGPKey,
} from 'pmcrypto';

import { VERIFICATION_STATUS, SRP_MODULUS_KEY } from '../constants';

const { NOT_SIGNED, SIGNED_AND_VALID } = VERIFICATION_STATUS;

/**
 * Get modulus keys.
 * @return {Promise}
 */
export const getModulusKeys = (() => {
    let cachedPromise: Promise<OpenPGPKey[]> | undefined;

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
 */
export const verifyModulus = async (keys: OpenPGPKey[], modulus: ReturnType<typeof createCleartextMessage>) => {
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
 */
export const verifyAndGetModulus = async (modulus: string) => {
    const [publicKeys, modulusParsed] = await Promise.all([getModulusKeys(), getCleartextMessage(modulus)]);
    await verifyModulus(publicKeys, modulusParsed);
    return binaryStringToArray(decodeBase64(modulusParsed.getText()));
};
