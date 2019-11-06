import { decryptMessage, encryptMessage, getMessage } from 'pmcrypto';
import { VERIFICATION_STATUS } from 'pmcrypto/lib/constants';
import getRandomValues from 'get-random-values';

import { serializeUint8Array } from '../helpers/serialization';

/**
 * Decrypts a member token with the organization private key
 * @param  {String} token
 * @param  {Object} privateKey decrypted private key
 * @return {Object} {PrivateKey, decryptedToken}
 */
export const decryptMemberToken = async (token, privateKey) => {
    const { data: decryptedToken, verified } = await decryptMessage({
        message: await getMessage(token),
        privateKeys: [privateKey],
        publicKeys: privateKey.toPublic()
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error('Signature verification failed');
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedToken;
};

/**
 * Generates the member token to decrypt its member key
 * @return {String}
 */
export const generateMemberToken = () => {
    const value = getRandomValues(new Uint8Array(128));
    return serializeUint8Array(value);
};

/**
 * Encrypt the member key password with a key.
 * @param  {String} token - The member key token
 * @param  {Object} privateKey - The key to encrypt the token with
 * @return {Object}
 */
export const encryptMemberToken = async (token, privateKey) => {
    const { data: encryptedToken } = await encryptMessage({
        data: token,
        publicKeys: [privateKey.toPublic()],
        privateKeys: [privateKey]
    });
    return encryptedToken;
};
