import {
    encryptMessage,
    signMessage,
    splitMessage,
    getPreferredAlgorithm,
    generateSessionKey,
    encryptSessionKey
} from 'pmcrypto';

import { CALENDAR_CARD_TYPE } from './constants';

/**
 * @param {String} dataToSign
 * @param {PGPKey} signingKey
 * @returns {Promise}
 */
export const signCard = (dataToSign, signingKey) => {
    if (!dataToSign) {
        return;
    }
    return signMessage({
        data: dataToSign,
        privateKeys: [signingKey],
        armor: false,
        detached: true
    }).then(({ signature }) => ({
        data: dataToSign,
        signature
    }));
};

/**
 * @param {String} dataToEncrypt
 * @param {PGPKey} signingKey
 * @param {PGPKey} sessionKey
 * @returns {Promise}
 */
export const encryptCard = (dataToEncrypt, signingKey, sessionKey) => {
    if (!dataToEncrypt) {
        return;
    }
    return encryptMessage({
        data: dataToEncrypt,
        privateKeys: [signingKey],
        sessionKey,
        armor: false,
        detached: true
    }).then(async ({ message, signature }) => {
        const { encrypted } = await splitMessage(message);
        return {
            dataPacket: encrypted[0],
            signature
        };
    });
};

/**
 * @param {Uint8Array} data
 * @param {String} algorithm
 * @param {PGPKey} publicKey
 * @returns {Promise<Uint8Array>}
 */
export const getEncryptedSessionKey = async ({ data, algorithm }, publicKey) => {
    const { message } = await encryptSessionKey({ data, algorithm, publicKeys: publicKey });
    const { asymmetric } = await splitMessage(message);
    return asymmetric[0];
};

/**
 * @param {PGPKey} publicKey
 * @returns {Promise}
 */
export const createSessionKey = async (publicKey) => {
    const algorithm = await getPreferredAlgorithm([publicKey]);
    const sessionKey = await generateSessionKey(algorithm);
    return {
        data: sessionKey,
        algorithm
    };
};

/**
 * @param {String} toSign
 * @param {String} toEncryptAndSign
 * @param {PGPKey} signingKey
 * @param {PGPKey} sessionKey
 * @returns {Promise}
 */
export const encryptAndSignPart = (
    { [CALENDAR_CARD_TYPE.SIGNED]: toSign, [CALENDAR_CARD_TYPE.ENCRYPTED_AND_SIGNED]: toEncryptAndSign },
    signingKey,
    sessionKey
) => {
    return Promise.all([signCard(toSign, signingKey), encryptCard(toEncryptAndSign, signingKey, sessionKey)]);
};
