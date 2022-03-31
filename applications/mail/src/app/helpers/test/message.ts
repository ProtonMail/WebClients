import { decryptMIMEMessage } from 'pmcrypto';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { CryptoProxy, PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { base64ToArray, arrayToBase64 } from '../base64';
import { generateSessionKey, encryptSessionKey, GeneratedKey } from './crypto';
import { readContentIDandLocation } from '../message/messageEmbeddeds';
import { MessageEmbeddedImage, MessageImage } from '../../logic/messages/messagesTypes';

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

// Blob type in Jest doesn't have the new arrayBuffer function, maybe not yet implemented in JSDom
const readBlob = async (blob: Blob) =>
    new Promise<Uint8Array>((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
            if (event.target?.result instanceof ArrayBuffer) {
                resolve(new Uint8Array(event.target.result));
            } else {
                reject(event);
            }
        };
        fileReader.readAsArrayBuffer(blob);
    });

export const decryptMessageLegacy = async (pack: any, privateKeys: PrivateKeyReference[], sessionKey: SessionKey) => {
    throw new Error('unsupported; TODO lara');
    const decryptResult = await CryptoProxy.decryptMessageLegacy({
        // @ts-ignore todo lara
        armoredMessage: await readBlob(pack.Body),
        messageDate: new Date(),
        privateKeys,
        sessionKeys: [sessionKey],
    });

    return { data: decryptResult.data, signatures: decryptResult.signatures };
};

export const decryptMessageMultipart = async (
    pack: any,
    privateKeys: PrivateKeyReference[],
    sessionKey: SessionKey
) => {
    throw new Error('unsupported; todo lara');
    const decryptResult = await decryptMIMEMessage({
        message: (await readBlob(pack.Body)) as any,
        messageDate: new Date(),
        // @ts-ignore todo lara
        privateKeys,
        sessionKeys: [sessionKey],
    });

    const bodyResult = await decryptResult.getBody();
    const attachments = await decryptResult.getAttachments();

    return { data: bodyResult?.body, mimeType: bodyResult?.mimetype, attachments };
};

export const createAttachment = async (inputAttachment: Partial<Attachment>, publicKeys: PublicKeyReference[]) => {
    const attachment = { ...inputAttachment };

    const sessionKey = await generateSessionKey(publicKeys[0]);
    const encryptedSessionKey = await encryptSessionKey(sessionKey, publicKeys[0]);

    attachment.KeyPackets = arrayToBase64(encryptedSessionKey);

    return { attachment, sessionKey };
};

export const encryptMessage = async (body: string, fromKeys: GeneratedKey, toKeys: GeneratedKey) => {
    const { message } = await CryptoProxy.encryptMessage({
        textData: body,
        stripTrailingSpaces: true,
        encryptionKeys: [toKeys.publicKeys?.[0]],
        signingKeys: [fromKeys.privateKeys?.[0]],
    });
    return message;
};

export const createEmbeddedImage = (attachment: Attachment) =>
    ({
        type: 'embedded',
        attachment,
        cid: readContentIDandLocation(attachment).cid,
        url: 'url',
        id: 'image-id',
        status: 'loaded',
    } as MessageEmbeddedImage);

export const createMessageImages = (images: MessageImage[] = []) => ({
    showEmbeddedImages: true,
    showRemoteImages: true,
    hasEmbeddedImages: true,
    hasRemoteImages: true,
    images,
});
