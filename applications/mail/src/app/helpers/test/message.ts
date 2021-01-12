import {
    decryptMessageLegacy as realDecryptMessageLegacy,
    decryptMIMEMessage,
    SessionKey,
    OpenPGPKey,
    encryptMessage as realEncryptMessage,
} from 'pmcrypto';
import { enums } from 'openpgp';

import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';

import { base64ToArray, arrayToBase64 } from '../base64';
import { generateSessionKey, encryptSessionKey, GeneratedKey } from './crypto';

export const createDocument = (content: string): Element => {
    const document = window.document.createElement('div');
    document.innerHTML = content;
    return document;
};

export const readSessionKey = (key: any) => {
    return {
        data: base64ToArray(key.Key),
        algorithm: key.Algorithm,
    };
};

export const decryptMessageLegacy = async (pack: any, privateKeys: OpenPGPKey[], sessionKey: SessionKey) => {
    const decryptResult = await realDecryptMessageLegacy({
        message: base64ToArray(pack.Body) as any,
        messageDate: new Date(),
        privateKeys,
        sessionKeys: [sessionKey],
    });

    return { data: decryptResult.data, signatures: decryptResult.signatures };
};

export const decryptMessageMultipart = async (pack: any, privateKeys: OpenPGPKey[], sessionKey: SessionKey) => {
    const decryptResult = await decryptMIMEMessage({
        message: base64ToArray(pack.Body) as any,
        messageDate: new Date(),
        privateKeys,
        sessionKeys: [sessionKey],
    });

    const bodyResult = await decryptResult.getBody();
    const attachments = await decryptResult.getAttachments();

    return { data: bodyResult?.body, mimeType: bodyResult?.mimetype, attachments };
};

export const createAttachment = async (inputAttachment: Partial<Attachment>, publicKeys: OpenPGPKey[]) => {
    const attachment = { ...inputAttachment };

    const sessionKey = await generateSessionKey(publicKeys[0]);
    const encryptedSessionKey = await encryptSessionKey(sessionKey, publicKeys[0]);

    attachment.KeyPackets = arrayToBase64(encryptedSessionKey);

    return { attachment, sessionKey };
};

export const encryptMessage = async (body: string, fromKeys: GeneratedKey, toKeys: GeneratedKey) => {
    const { data } = await realEncryptMessage({
        data: body,
        publicKeys: [toKeys.publicKeys?.[0]],
        privateKeys: [fromKeys.privateKeys?.[0]],
        compression: enums.compression.zip,
    });
    return data;
};
