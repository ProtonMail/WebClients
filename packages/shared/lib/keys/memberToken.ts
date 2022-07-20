import getRandomValues from '@proton/get-random-values';
import { CryptoProxy, PrivateKeyReference, PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';

import { uint8ArrayToBase64String } from '../helpers/encoding';

/**
 * Decrypts a member token with the organization private key
 */
export const decryptMemberToken = async (
    token: string,
    privateKeys: PrivateKeyReference[],
    publicKeys: PublicKeyReference[]
) => {
    const { data: decryptedToken, verified } = await CryptoProxy.decryptMessage({
        armoredMessage: token,
        decryptionKeys: privateKeys,
        verificationKeys: publicKeys,
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error('Signature verification failed');
        error.name = 'SignatureError';
        throw error;
    }

    return `${decryptedToken}`;
};

/**
 * Generates the member token to decrypt its member key
 */
export const generateMemberToken = () => {
    const token = getRandomValues(new Uint8Array(128));
    return uint8ArrayToBase64String(token);
};

/**
 * Encrypt the member key password with a key.
 * @param token - The member key token in base64
 * @param privateKey - The key to encrypt the token with
 */
export const encryptMemberToken = async (token: string, privateKey: PrivateKeyReference) => {
    const { message: encryptedToken } = await CryptoProxy.encryptMessage({
        textData: token,
        stripTrailingSpaces: true,
        encryptionKeys: [privateKey],
        signingKeys: [privateKey],
    });
    return encryptedToken;
};
