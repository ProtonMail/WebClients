/**
 * Extract public key from the private key
 * @param {String} privateKey
 * @return {Promise<String>}
 */
export async function getPublicKey(privateKey) {
    const [key] = await pmcrypto.getKeys(privateKey);
    return key.toPublic().armor();
}
