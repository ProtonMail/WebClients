import { decryptMessage, encryptMessage, getMessage, SessionKey, splitMessage } from 'pmcrypto';
import { deserializeUint8Array, serializeUint8Array } from '../helpers/serialization';

export const getSessionKey = (data: Uint8Array) => {
    return {
        data,
        algorithm: 'aes256',
    };
};

export const getEncryptedBlob = async (sessionKey: SessionKey, data: string) => {
    const { message } = await encryptMessage({
        data,
        sessionKey,
        armor: false,
        detached: true,
    });
    const { encrypted } = await splitMessage(message);
    return serializeUint8Array(encrypted[0]);
};

export const getDecryptedBlob = async (sessionKey: SessionKey, blob: string) => {
    const { data: result } = await decryptMessage({
        message: await getMessage(deserializeUint8Array(blob)),
        sessionKeys: [sessionKey],
    });
    return result;
};
