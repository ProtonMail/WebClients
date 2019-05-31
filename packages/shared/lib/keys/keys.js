import { getKeys, decryptMessage, decryptPrivateKey as decryptArmoredKey, getMessage } from 'pmcrypto';

import { VERIFICATION_STATUS } from 'pmcrypto/lib/constants';

import { noop } from '../helpers/function';

/**
 * Given a list of keys and joining key salts, get the primary key and the corresponding key salt.
 * @param {Array} Keys
 * @param {Array} KeySalts
 * @return {{PrivateKey, KeySalt}}
 */
export const getPrimaryKeyWithSalt = (Keys = [], KeySalts = []) => {
    const [primaryKey] = Keys;
    const { PrivateKey, ID } = primaryKey || {};
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
const decryptMemberToken = async (token, decryptedOrganizationKey) => {
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
 * Decrypt the keys for a list of addresses.
 * @param {Array} Addresses
 * @param {String} keyPassword
 * @param {String} [OrganizationPrivateKey]
 * @return {Promise}
 */
export const prepareKeys = async ({ Keys = [], keyPassword, OrganizationPrivateKey }) => {
    if (!keyPassword) {
        throw new Error('Key password required');
    }

    if (OrganizationPrivateKey) {
        const decryptedOrganizationKey = await decryptArmoredKey(OrganizationPrivateKey, keyPassword).catch(noop);

        return Promise.all(
            Keys.map(async (Key) => {
                const { PrivateKey, Token, Activation } = Key;
                const decryptedToken = await decryptMemberToken(Token || Activation, decryptedOrganizationKey).catch(
                    noop
                );

                const [privateKey] = await getKeys(PrivateKey);
                await privateKey.decrypt(decryptedToken).catch(noop);

                return {
                    Key,
                    privateKey
                };
            })
        );
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
