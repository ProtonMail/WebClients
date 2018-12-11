import { keyInfo, getKeys, encodeBase64, arrayToBinaryString, stripArmor } from 'pmcrypto';

/**
 * Extract public key from the private key
 * @param {String} privateKey
 * @return {Promise<String>}
 */
export async function getPublicKey(privateKey) {
    const [key] = await getKeys(privateKey);
    return key.toPublic().armor();
}

/**
 * Helper to add pmcrypto.getKeys to keys
 * Add keys parameter in the key Object
 * @param {Array<Object>} keys
 * @param {String} parameter ex: 'PublicKey', 'PrivateKey', 'publicKeyArmored'
 * @return {Promise<Array>}
 */
export function addGetKeys(keys = [], parameter) {
    const extendKey = async (key) => {
        const keys = (await getKeys(key[parameter])) || [];
        return { ...key, keys };
    };

    return Promise.all(keys.map(extendKey));
}

/**
 * Get key info.
 * @param {Object} key
 * @returns {Promise<Object>}
 */
export async function getKeyInfo(key = {}) {
    const { created, bitSize, fingerprint, algorithmName } = await keyInfo(key.PrivateKey);

    return {
        ...key,
        created,
        bitSize,
        fingerprint,
        algorithmName
    };
}

/**
 * Prepare a key by adding information and generating the corresponding public key to the key object.
 * @param {Object} source
 */
export async function formatKey(source) {
    const key = await getKeyInfo(source);
    const [k] = await getKeys(key.PrivateKey);

    return { ...key, PublicKey: k.toPublic().armor() };
}

/**
 * Format multiple keys.
 * @param {Array} addresses
 * @returns {Promise<Array>}
 */
export const formatKeys = async (addresses = []) => {
    const promises = addresses.reduce((acc, address) => {
        const { Keys = [] } = address;
        const pKeys = Promise.all(Keys.map(formatKey));

        return acc.concat(pKeys.then((keys) => ({ ...address, Keys: keys })));
    }, []);

    return Promise.all(promises);
};

/**
 * Get a key as base 64 uri
 * @param {String|Uint8Array} key
 * @returns {Promise<String>}
 */
export const getKeyAsUri = async (key) => {
    const data = typeof key === 'string' ? await stripArmor(key) : key;
    return 'data:application/pgp-keys;base64,' + encodeBase64(arrayToBinaryString(data));
};
