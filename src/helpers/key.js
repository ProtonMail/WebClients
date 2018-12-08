import * as pmcrypto from 'pmcrypto';

/**
 * Extract public key from the private key
 * @param {String} privateKey
 * @return {Promise<String>}
 */
export async function getPublicKey(privateKey) {
    const [key] = await pmcrypto.getKeys(privateKey);
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
        const keys = (await pmcrypto.getKeys(key[parameter])) || [];
        return { ...key, keys };
    };

    return Promise.all(keys.map(extendKey));
}
