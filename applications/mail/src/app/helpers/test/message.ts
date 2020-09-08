import {
    decryptSessionKey as realDecryptSessionKey,
    decryptMessageLegacy as realDecryptMessageLegacy,
    decryptMIMEMessage,
    getMessage,
    SessionKey
} from 'pmcrypto';
import { OpenPGPKey } from 'pmcrypto';

import { base64ToArray } from '../base64';

export const decryptSessionKey = async (address: any, addressPrivateKeys: OpenPGPKey[]) => {
    const sessionKeyMessage = await getMessage(base64ToArray(address.BodyKeyPacket));
    return (await realDecryptSessionKey({
        message: sessionKeyMessage,
        privateKeys: addressPrivateKeys
    })) as SessionKey;
};

export const readSessionKey = (pack: any) => {
    return {
        data: base64ToArray(pack.BodyKey.Key),
        algorithm: pack.BodyKey.Algorithm
    };
};

export const decryptMessageLegacy = async (pack: any, privateKeys: OpenPGPKey[], sessionKey: SessionKey) => {
    const decryptResult = await realDecryptMessageLegacy({
        message: base64ToArray(pack.Body) as any,
        messageDate: new Date(),
        privateKeys: privateKeys,
        sessionKeys: [sessionKey]
    });

    return { data: decryptResult.data };
};

export const decryptMessageMultipart = async (pack: any, privateKeys: OpenPGPKey[], sessionKey: SessionKey) => {
    const decryptResult = await decryptMIMEMessage({
        message: base64ToArray(pack.Body) as any,
        messageDate: new Date(),
        privateKeys: privateKeys,
        sessionKeys: [sessionKey]
    });

    const bodyResult = await decryptResult.getBody();

    return { data: bodyResult?.body, mimeType: bodyResult?.mimetype };
};
