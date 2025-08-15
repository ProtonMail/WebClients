import type { PrivateKeyReference, PublicKeyReference, SessionKey, WorkerDecryptionOptions } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import type { MessageEmbeddedImage, MessageImage, MessageImages } from '@proton/mail/store/messages/messagesTypes';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import { arrayToBase64, base64ToArray } from '../base64';
import { readContentIDandLocation } from '../message/messageEmbeddeds';
import type { GeneratedKey } from './crypto';
import { encryptSessionKey, generateSessionKey } from './crypto';

// Helper to make testing easier
export const removeLineBreaks = (text: string) => {
    return text.replaceAll(/\n/g, '');
};

export const readSessionKey = (key: any) => {
    return {
        data: base64ToArray(key.Key),
        algorithm: key.Algorithm,
    };
};

// Blob type in Jest doesn't have the new arrayBuffer function, maybe not yet implemented in JSDom
const readBlob = async (blob: Blob) =>
    new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
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

export const decryptMessage = async (pack: any, privateKeys: PrivateKeyReference[], sessionKey: SessionKey) => {
    const decryptResult = await CryptoProxy.decryptMessage({
        binaryMessage: await readBlob(pack.Body),
        decryptionKeys: privateKeys,
        sessionKeys: [sessionKey],
    });

    return { data: decryptResult.data, signatures: decryptResult.signatures };
};

/**
 * Decrypts the mime message and parses the body and attachments in the right structure.
 * @param options
 * @return {Promise<{getBody: (function(): Promise<{body, mimetype}>), getAttachments: (function(): Promise<any>), getEncryptedSubject: (function(): Promise<any>), verify: (function(): Promise<any>), errors: (function(): Promise<any>), stop: stop}>}
 */
export async function decryptMIMEMessage(options: WorkerDecryptionOptions) {
    const {
        data: rawData,
        verificationStatus,
        signatures,
    } = await CryptoProxy.decryptMessage({ ...options, format: 'utf8' });

    const {
        body,
        mimeType,
        verificationStatus: pgpMimeVerified,
        attachments,
        encryptedSubject,
        signatures: pgpMimeSignatures,
    } = await CryptoProxy.processMIME({ ...options, data: rawData });

    const combinedVerified =
        verificationStatus === VERIFICATION_STATUS.NOT_SIGNED ? pgpMimeVerified : verificationStatus;

    return {
        getBody: () => Promise.resolve(body ? { body, mimeType } : undefined),
        getAttachments: () => Promise.resolve(attachments),
        getEncryptedSubject: () => Promise.resolve(encryptedSubject),
        verify: () => Promise.resolve(combinedVerified),
        stop() {},
        signatures: [...signatures, ...pgpMimeSignatures],
    };
}

export const decryptMessageMultipart = async (
    pack: any,
    privateKeys: PrivateKeyReference[],
    sessionKey: SessionKey
) => {
    const decryptResult = await decryptMIMEMessage({
        binaryMessage: await readBlob(pack.Body),
        decryptionKeys: privateKeys,
        sessionKeys: [sessionKey],
    });

    const bodyResult = await decryptResult.getBody();
    const attachments = await decryptResult.getAttachments();

    return { data: bodyResult?.body, mimeType: bodyResult?.mimeType, attachments };
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
    }) as MessageEmbeddedImage;

export const createMessageImages = (images: MessageImage[] = []) =>
    ({
        showEmbeddedImages: true,
        showRemoteImages: true,
        hasEmbeddedImages: true,
        hasRemoteImages: true,
        trackersStatus: 'not-loaded',
        images,
    }) as MessageImages;
