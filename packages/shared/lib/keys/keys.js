import { decryptMessage, decryptPrivateKey, getMessage, keyInfo } from 'pmcrypto';

const noop = () => {};

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
 * @param  {Object} orgPrivateKey decrypted organization private key
 * @return {Object} {PrivateKey, decryptedToken}
 */
const decryptMemberToken = async (token, orgPrivateKey = {}) => {
    const { data: decryptedToken, verified } = await decryptMessage({
        message: await getMessage(token),
        privateKeys: [orgPrivateKey],
        publicKeys: orgPrivateKey.toPublic()
    });

    if (verified !== 1) {
        throw new Error('Signature verification failed');
    }

    return decryptedToken;
};

/**
 * Decrypts a member key using the decrypted member token
 * @param  {Object} decryptedKey decrypted organization private key
 * @return {Object} decrypted key
 */
const createDecryptKeyWithKey = (decryptedKey) => async (Key) => {
    const { PrivateKey, Token, Activation } = Key;
    // TODO: Does it need to check Token || Activation?
    const decryptedToken = await decryptMemberToken(Token || Activation, decryptedKey).catch(noop);
    const decryptedPrivateKey = await decryptPrivateKey(PrivateKey, decryptedToken);
    return {
        decryptedPrivateKey,
        Key,
        info: await keyInfo(PrivateKey)
    };
};

/**
 * Create a decrypt key function given a keyPassword.
 * @param {String} keyPassword
 * @return {function}
 */
const createDecryptKeyWithPassword = (keyPassword) => async (Key) => {
    const { PrivateKey } = Key;
    const decryptedPrivateKey = await decryptPrivateKey(PrivateKey, keyPassword).catch(noop);
    return {
        decryptedPrivateKey,
        Key,
        info: await keyInfo(PrivateKey)
    };
};

/**
 * Decrypt a list of user keys.
 * @param {Array} UserKeys
 * @param {String} keyPassword
 * @param {String} [OrganizationPrivateKey]
 * @return {Promise}
 */
export const prepareUserKeys = async (UserKeys = [], keyPassword, OrganizationPrivateKey) => {
    const decryptKeyWithPassword = createDecryptKeyWithPassword(keyPassword);

    if (OrganizationPrivateKey) {
        const decryptedOrganizationKey = await decryptKeyWithPassword(OrganizationPrivateKey);
        const decryptKeyWithKey = createDecryptKeyWithKey(decryptedOrganizationKey);
        return Promise.all(UserKeys.map(decryptKeyWithKey));
    }

    return Promise.all(UserKeys.map(decryptKeyWithPassword));
};

/**
 * Format the address keys in an object where each ID corresponds to the list of decrypt keys.
 * @param {function} decryptKeyCb
 * @param {Array} Addresses
 * @return {Promise}
 */
const formatAddressKeys = async (decryptKeyCb, Addresses = []) => {
    const addressKeys = await Promise.all(
        Addresses.map(async ({ ID, Keys: AddressKeys = [] }) => {
            const keys = await Promise.all(AddressKeys.map(decryptKeyCb));
            return {
                keys,
                ID
            };
        })
    );

    return addressKeys.reduce((acc, { ID, keys }) => {
        acc[ID] = keys;
        return acc;
    }, {});
};

/**
 * Decrypt the keys for a list of addresses.
 * @param {Array} Addresses
 * @param {String} keyPassword
 * @param {String} [OrganizationPrivateKey]
 * @return {Promise}
 */
export const prepareAddressKeys = async (Addresses = [], keyPassword, OrganizationPrivateKey) => {
    const decryptKeyWithPassword = createDecryptKeyWithPassword(keyPassword);

    if (OrganizationPrivateKey) {
        const decryptedOrganizationKey = await decryptKeyWithPassword(OrganizationPrivateKey);
        const decryptKeyWithKey = createDecryptKeyWithKey(decryptedOrganizationKey);
        return formatAddressKeys(decryptKeyWithKey, Addresses);
    }

    return formatAddressKeys(decryptKeyWithPassword, Addresses);
};
