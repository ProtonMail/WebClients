import { getKeys, decryptMessage, getMessage, encodeBase64, arrayToBinaryString, encryptMessage } from 'pmcrypto';
import getRandomValues from 'get-random-values';
import { VERIFICATION_STATUS } from 'pmcrypto/lib/constants';

import { noop } from '../helpers/function';

/**
 * @param {Array} keys - Keys array that has been prepared by `prepareKeys`
 * @return {Object}
 */
export const getPrimaryKey = (keys = []) => {
    return keys.find(({ Key: { Primary } }) => Primary === 1);
};

/**
 * Given a list of keys and joining key salts, get the primary key and the corresponding key salt.
 * @param {Array} Keys - Keys as received from the API
 * @param {Array} KeySalts - KeySalts as received from the API
 * @return {{PrivateKey, KeySalt}}
 */
export const getPrimaryKeyWithSalt = (Keys = [], KeySalts = []) => {
    const { PrivateKey, ID } = Keys.find(({ Primary }) => Primary === 1) || {};
    const { KeySalt } = KeySalts.find(({ ID: keySaltID }) => ID === keySaltID) || {};

    // Not verifying that KeySalt exists because of old auth versions.
    return {
        PrivateKey,
        KeySalt
    };
};

/**
 * Decrypts a member token with the organization private key
 * @param  {String} token
 * @param  {Object} decryptedOrganizationKey decrypted organization private key
 * @return {Object} {PrivateKey, decryptedToken}
 */
export const decryptMemberToken = async (token, decryptedOrganizationKey) => {
    const { data: decryptedToken, verified } = await decryptMessage({
        message: await getMessage(token),
        privateKeys: [decryptedOrganizationKey],
        publicKeys: decryptedOrganizationKey.toPublic()
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        throw new Error('Signature verification failed');
    }

    return decryptedToken;
};

/**
 * Generates the member token to decrypt its member key
 * @return {Object}
 */
export const generateMemberToken = () => {
    const value = getRandomValues(new Uint8Array(128));
    return encodeBase64(arrayToBinaryString(value));
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

/**
 * Decrypt the list of member keys with the organization key.
 * @param {Array} Keys
 * @param {Object} organizationKey
 * @return {Promise}
 */
export const prepareMemberKeys = (Keys, organizationKey) => {
    if (!organizationKey && Keys.length > 0) {
        throw new Error('Organization key required');
    }
    return Promise.all(
        Keys.map(async (Key) => {
            const { PrivateKey, Token, Activation } = Key;
            const decryptedToken = await decryptMemberToken(Token || Activation, organizationKey).catch(noop);

            const [privateKey] = await getKeys(PrivateKey);
            await privateKey.decrypt(decryptedToken).catch(noop);

            return {
                Key,
                privateKey
            };
        })
    );
};

/**
 * Decrypt the keys for a list of addresses.
 * @param {Array} Keys
 * @param {String} keyPassword
 * @return {Promise}
 */
export const prepareKeys = async (Keys = [], keyPassword) => {
    if (!keyPassword && Keys.length > 0) {
        throw new Error('Key password required');
    }
    return Promise.all(
        Keys.map(async (Key) => {
            const { PrivateKey } = Key;

            const [privateKey] = await getKeys(PrivateKey);
            await privateKey.decrypt(keyPassword).catch(noop);

            return {
                Key,
                privateKey
            };
        })
    );
};
