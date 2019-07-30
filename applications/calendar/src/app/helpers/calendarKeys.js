import { generateKey, encryptMessage, getMessage, splitMessage, encodeBase64, arrayToBinaryString } from 'pmcrypto';

import getRandomValues from 'get-random-values';

/**
 * Generates the member token to decrypt its member key
 * @return {Object}
 */
export const generatePassphrase = () => {
    const value = getRandomValues(new Uint8Array(32));
    return encodeBase64(arrayToBinaryString(value));
};

/**
 * @param {String} email
 * @param {String} passphrase
 * @param {Object} encryptionConfig
 * @returns {Promise<{privateKeyArmored, privateKey}>}
 */
export const generateCalendarKey = async ({ email, passphrase, encryptionConfig }) => {
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name: email, email }],
        passphrase,
        ...encryptionConfig
    });

    await privateKey.decrypt(passphrase);

    return { privateKey, privateKeyArmored };
};

/**
 * @param {String} passphrase
 * @param {Object} privateKey
 * @param {Object} memberPublicKeys
 * @returns {Promise<{keyPackets, dataPacket, signature}>}
 */
export const encryptPassphrase = async ({ passphrase, privateKey, memberPublicKeys }) => {
    const { data, signature } = await encryptMessage({
        data: passphrase,
        publicKeys: Object.values(memberPublicKeys),
        privateKeys: [privateKey],
        detached: true
    });
    const message = await getMessage(data);
    const { asymmetric, encrypted } = await splitMessage(message);

    return {
        keyPackets: Object.entries(memberPublicKeys).reduce((acc, [memberID], index) => {
            acc[memberID] = encodeBase64(arrayToBinaryString(asymmetric[index]));
            return acc;
        }, Object.create(null)),
        dataPacket: encodeBase64(arrayToBinaryString(encrypted[0])),
        signature
    };
};
