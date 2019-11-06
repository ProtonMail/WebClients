import {
    createCleartextMessage,
    decryptMessage,
    decryptSessionKey,
    getMessage,
    getSignature,
    verifyMessage
} from 'pmcrypto';
import { VERIFICATION_STATUS } from 'pmcrypto/lib/constants';

import { deserializeUint8Array } from '../helpers/serialization';
import { CALENDAR_CARD_TYPE } from './constants';

/**
 * @param {Uint8Array} data
 * @param {Array<PGPKey>} privateKeys
 * @returns {Promise}
 */
export const getDecryptedSessionKey = async (data, privateKeys) => {
    return decryptSessionKey({ message: await getMessage(data), privateKeys });
};

/**
 * @param {String} dataToVerify
 * @param {String} signature
 * @param {Array<PGPKey>|PGPKey} publicKeys
 * @returns {Promise}
 */
export const verifySignedCard = async (dataToVerify, signature, publicKeys) => {
    const { verified } = await verifyMessage({
        message: await createCleartextMessage(dataToVerify),
        publicKeys,
        signature: await getSignature(signature),
        detached: true
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error('Signature verification failed');
        error.name = 'SignatureError';
        throw error;
    }

    return dataToVerify;
};

/**
 * @param {Uint8Array} dataToDecrypt
 * @param {String} signature
 * @param {Array<PGPKey>|PGPKey} publicKeys
 * @param {PGPKey} sessionKey
 * @returns {Promise}
 */
export const decryptCard = async (dataToDecrypt, signature, publicKeys, sessionKey) => {
    const { data: decryptedData, verified } = await decryptMessage({
        message: await getMessage(dataToDecrypt),
        publicKeys,
        signature: await getSignature(signature),
        sessionKeys: [sessionKey]
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error('Signature verification failed');
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedData;
};

/**
 * @param {Object} signed
 * @param {Object} encryptedAndSigned
 * @param {Array<PGPKey>|PGPKey>} publicKeys
 * @param {PGPKey} sessionKey
 * @returns {Promise}
 */
export const decryptAndVerifyPart = (
    { [CALENDAR_CARD_TYPE.SIGNED]: signed, [CALENDAR_CARD_TYPE.ENCRYPTED_AND_SIGNED]: encryptedAndSigned },
    publicKeys,
    sessionKey
) => {
    return Promise.all([
        signed && verifySignedCard(signed.Data, signed.Signature, publicKeys),
        encryptedAndSigned &&
            decryptCard(
                deserializeUint8Array(encryptedAndSigned.Data),
                encryptedAndSigned.Signature,
                publicKeys,
                sessionKey
            )
    ]);
};
