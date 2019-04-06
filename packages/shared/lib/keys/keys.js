import { decryptMessage, decryptPrivateKey, getMessage, keyInfo as getKeyInfo } from 'pmcrypto';

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
 * Try to decrypt a private key and get metadata.
 * @param {String} encryptedKey
 * @param {String} keyPassword
 * @param {object} cachedKeyResult
 * @returns {Promise}
 */
const getDecryptedKeyWithMetadata = async (encryptedKey, keyPassword, cachedKeyResult = {}) => {
    const { info: cachedInfo, decryptedPrivateKey: cachedDecryptedPrivateKey } = cachedKeyResult;

    const [decryptedPrivateKey, info] = await Promise.all([
        cachedDecryptedPrivateKey || decryptPrivateKey(encryptedKey, keyPassword).catch(noop),
        cachedInfo || getKeyInfo(encryptedKey)
    ]);

    return {
        decryptedPrivateKey,
        info
    };
};

/**
 * Decrypts a member key using the decrypted member token
 * @param  {Object} decryptedKey decrypted organization private key
 * @return {Object} decrypted key
 */
const createDecryptKeyWithKey = (decryptedKey) => async (Key, cachedKeyResult) => {
    const { PrivateKey, Token, Activation } = Key;
    // TODO: Does it need to check Token || Activation?
    const decryptedToken = await decryptMemberToken(Token || Activation, decryptedKey);
    const result = await getDecryptedKeyWithMetadata(PrivateKey, decryptedToken, cachedKeyResult);
    return {
        Key,
        ...result
    };
};

/**
 * Create a decrypt key function given a keyPassword.
 * @param {String} keyPassword
 * @return {function}
 */
const createDecryptKeyWithPassword = (keyPassword) => async (Key, cachedKeyResult) => {
    const { PrivateKey } = Key;
    const result = await getDecryptedKeyWithMetadata(PrivateKey, keyPassword, cachedKeyResult);
    return {
        Key,
        ...result
    };
};

/**
 * Format the address keys in an object where each ID corresponds to the list of decrypt keys.
 * @param {function} decryptKeyCb
 * @param {Array} Addresses
 * @param {object} cache
 * @return {Promise}
 */
const formatAddressKeys = async (decryptKeyCb, Addresses, cache) => {
    const addressKeys = await Promise.all(
        Addresses.map(async ({ ID, Keys: AddressKeys = [] }) => {
            const keysCache = cache[ID] || {};
            const keysWithMetadata = await Promise.all(AddressKeys.map((Key) => decryptKeyCb(Key, keysCache[Key.ID])));
            const keysMap = keysWithMetadata.reduce((acc, keyData) => {
                const { Key } = keyData;
                acc[Key.ID] = keyData;
                return acc;
            }, {});
            return {
                map: keysMap,
                ID
            };
        })
    );

    return addressKeys.reduce((acc, { ID, map }) => {
        acc[ID] = map;
        return acc;
    }, {});
};

/**
 * Decrypt the keys for a list of addresses.
 * @param {Array} Addresses
 * @param {String} keyPassword
 * @param {String} [OrganizationPrivateKey]
 * @param {object} [cache]
 * @return {Promise}
 */
export const prepareAddressKeys = async ({ Addresses = [], keyPassword, OrganizationPrivateKey, cache = {} }) => {
    if (!keyPassword) {
        throw new Error('Key password required');
    }

    if (OrganizationPrivateKey) {
        const decryptedOrganizationKey = await decryptPrivateKey(OrganizationPrivateKey, keyPassword);
        const decryptKeyWithKey = createDecryptKeyWithKey(decryptedOrganizationKey);
        return formatAddressKeys(decryptKeyWithKey, Addresses, cache);
    }

    const decryptKeyWithPassword = createDecryptKeyWithPassword(keyPassword);
    return formatAddressKeys(decryptKeyWithPassword, Addresses, cache);
};

/**
 * Decrypt a list of user keys.
 * @param {Array} UserKeys
 * @param {String} keyPassword
 * @param {String} [OrganizationPrivateKey]
 * @param {object} [cache]
 * @return {Promise}
 */
export const prepareUserKeys = async ({ UserKeys = [], keyPassword, OrganizationPrivateKey, cache = {} }) => {
    const KEY = 'userKeys';
    const { [KEY]: keys } = await prepareAddressKeys({
        Addresses: [
            {
                ID: KEY,
                Keys: UserKeys
            }
        ],
        keyPassword,
        OrganizationPrivateKey,
        cache: {
            [KEY]: cache
        }
    });
    return keys;
};
