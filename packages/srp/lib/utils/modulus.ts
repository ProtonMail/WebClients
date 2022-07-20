import { binaryStringToArray, decodeBase64 } from '@proton/crypto/lib/utils';
import { CryptoProxy, PublicKeyReference } from '@proton/crypto';

import { VERIFICATION_STATUS, SRP_MODULUS_KEY } from '../constants';

const { NOT_SIGNED, SIGNED_AND_VALID } = VERIFICATION_STATUS;

/**
 * Get key to verify the modulus
 */
export const getModulusKey = (() => {
    let cachedKeyReference: PublicKeyReference | undefined;

    const get = async () => {
        try {
            const keyReference = await CryptoProxy.importPublicKey({ armoredKey: SRP_MODULUS_KEY });
            cachedKeyReference = keyReference;
            return cachedKeyReference;
        } catch (e) {
            cachedKeyReference = undefined;
            throw e;
        }
    };

    return async () => {
        const isValidKeyReference =
            cachedKeyReference &&
            // after logging out, the key store is cleared, and the key reference becomes invalid.
            // try and export the key to see if it's still valid
            (await CryptoProxy.exportPublicKey({ key: cachedKeyReference, format: 'binary' })
                .then(() => true)
                .catch(() => false));
        if (isValidKeyReference) {
            return cachedKeyReference as PublicKeyReference;
        }
        return get();
    };
})();

/**
 * Verify the modulus signature with the SRP public key
 * @returns modulus value if verification is successful
 * @throws on verification error
 */
export const verifyModulus = async (publicKey: PublicKeyReference, modulus: string) => {
    try {
        const { data: modulusData, verified = NOT_SIGNED } = await CryptoProxy.verifyCleartextMessage({
            armoredCleartextMessage: modulus,
            verificationKeys: publicKey,
        });

        if (verified !== SIGNED_AND_VALID) {
            throw new Error();
        }

        return modulusData;
    } catch (e) {
        throw new Error('Unable to verify server identity');
    }
};

/**
 * Verify modulus from the API and get the value.
 */
export const verifyAndGetModulus = async (modulus: string) => {
    const publicKey = await getModulusKey();
    const modulusData = await verifyModulus(publicKey, modulus);
    return binaryStringToArray(decodeBase64(modulusData));
};
