import { decryptMessage, encryptMessage, getMessage, OpenPGPKey, VERIFICATION_STATUS } from 'pmcrypto';
import getRandomValues from 'get-random-values';

import { serializeUint8Array } from '../helpers/serialization';

/**
 * Decrypts a member token with the organization private key
 */
export const decryptMemberToken = async (token: string, privateKey: OpenPGPKey) => {
    const { data: decryptedToken, verified } = await decryptMessage({
        message: await getMessage(token),
        privateKeys: [privateKey],
        publicKeys: privateKey.toPublic(),
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
    const value = getRandomValues(new Uint8Array(128));
    return serializeUint8Array(value) as string;
};

/**
 * Encrypt the member key password with a key.
 * @param token - The member key token
 * @param privateKey - The key to encrypt the token with
 */
export const encryptMemberToken = async (token: string, privateKey: OpenPGPKey) => {
    const { data: encryptedToken } = await encryptMessage({
        data: token,
        publicKeys: [privateKey.toPublic()],
        privateKeys: [privateKey],
    });
    return encryptedToken;
};
