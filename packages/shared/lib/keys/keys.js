import { getKeys, generateKey } from 'pmcrypto';

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
 * @param {String} [name=email]
 * @param {String} email
 * @param {String} passphrase
 * @param {Object} encryptionConfig
 * @returns {Promise<{privateKeyArmored, privateKey}>}
 */
export const generateAddressKey = async ({ email, name = email, passphrase, encryptionConfig }) => {
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name, email }],
        passphrase,
        ...encryptionConfig
    });

    await privateKey.decrypt(passphrase);

    return { privateKey, privateKeyArmored };
};

/**
 * Decrypt a list of keys.
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
