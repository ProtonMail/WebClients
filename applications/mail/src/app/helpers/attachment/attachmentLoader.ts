import {
    CryptoProxy,
    PublicKeyReference,
    SessionKey,
    VERIFICATION_STATUS,
    WorkerDecryptionResult,
} from '@proton/crypto';
import { binaryStringToArray, concatArrays, decodeBase64 } from '@proton/crypto/lib/utils';
import { getAttachment } from '@proton/shared/lib/api/attachments';
import { getEOAttachment } from '@proton/shared/lib/api/eo';
import { Api } from '@proton/shared/lib/interfaces';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getEOSessionKey, getSessionKey } from '@proton/shared/lib/mail/send/attachments';

import { MessageKeys, MessageVerification } from '../../logic/messages/messagesTypes';

// Reference: Angular/src/app/attachments/services/AttachmentLoader.js

export const decrypt = async (
    encryptedBinaryBuffer: ArrayBuffer,
    sessionKey: SessionKey,
    signature?: string,
    publicKeys?: PublicKeyReference | PublicKeyReference[]
): Promise<WorkerDecryptionResult<Uint8Array>> => {
    const encryptedBinary = new Uint8Array(encryptedBinaryBuffer);

    try {
        // eslint-disable-next-line @typescript-eslint/return-await
        return await CryptoProxy.decryptMessage({
            // a promise is returned here, just not detected properly by TS
            binaryMessage: encryptedBinary,
            sessionKeys: [sessionKey],
            armoredSignature: signature,
            verificationKeys: publicKeys,
            format: 'binary',
        });
    } catch (err: any) {
        console.error(err);
        throw err;
    }
};

export const getRequest = ({ ID = '' }: Attachment = {}, api: Api, messageKeys: MessageKeys): Promise<ArrayBuffer> => {
    if (messageKeys.type === 'outside') {
        return api(getEOAttachment(ID, messageKeys.decryptedToken, messageKeys.id));
    }
    return api(getAttachment(ID));
};

export const getDecryptedAttachment = async (
    attachment: Attachment,
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    api: Api
): Promise<WorkerDecryptionResult<Uint8Array>> => {
    const isOutside = messageKeys.type === 'outside';
    const encryptedBinary = await getRequest(attachment, api, messageKeys);

    try {
        if (!isOutside) {
            const sessionKey = await getSessionKey(attachment, messageKeys.privateKeys);
            // verify attachment signature only when sender is verified
            const publicKeys = verification?.senderVerified ? verification.senderPinnedKeys : undefined;
            return await decrypt(encryptedBinary, sessionKey, attachment.Signature, publicKeys);
        }
        const sessionKey = await getEOSessionKey(attachment, messageKeys.password);
        // eslint-disable-next-line @typescript-eslint/return-await
        return await CryptoProxy.decryptMessage({
            // a promise is returned here, just not detected properly by TS
            binaryMessage: new Uint8Array(encryptedBinary),
            passwords: [messageKeys.password],
            format: 'binary',
            sessionKeys: [sessionKey],
        });
    } catch (error: any) {
        const blob = concatArrays([
            binaryStringToArray(decodeBase64(attachment.KeyPackets) || ''),
            new Uint8Array(encryptedBinary),
        ]);
        // Fallback download raw attachment
        const newError = new Error('Attachment decryption error');
        Object.assign(newError, { data: attachment, binary: blob, error });
        throw newError;
    }
};

export const getAndVerify = async (
    attachment: Attachment = {},
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    reverify = false,
    api: Api,
    getAttachment?: (ID: string) => WorkerDecryptionResult<Uint8Array> | undefined,
    onUpdateAttachment?: (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => void
): Promise<WorkerDecryptionResult<Uint8Array>> => {
    const isOutside = messageKeys.type === 'outside';
    let attachmentdata: WorkerDecryptionResult<Uint8Array>;

    const attachmentID = attachment.ID || '';

    if (attachment.Preview) {
        return {
            data: attachment.Preview,
            filename: 'preview',
            signatures: [],
            verified: VERIFICATION_STATUS.NOT_SIGNED,
        };
    }

    if (!isOutside && getAttachment && onUpdateAttachment) {
        const attachmentInState = getAttachment(attachmentID);
        if (!reverify && attachmentInState) {
            attachmentdata = attachmentInState;
        } else {
            const isMIMEAttachment = !attachment.KeyPackets;

            attachmentdata = isMIMEAttachment
                ? (attachmentInState as WorkerDecryptionResult<Uint8Array>)
                : await getDecryptedAttachment(attachment, verification, messageKeys, api);
        }
        onUpdateAttachment(attachmentID, attachmentdata);
    } else {
        attachmentdata = await getDecryptedAttachment(attachment, verification, messageKeys, api);
    }

    return attachmentdata;
};

export const get = (
    attachment: Attachment = {},
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    api: Api,
    getAttachment?: (ID: string) => WorkerDecryptionResult<Uint8Array> | undefined,
    onUpdateAttachment?: (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => void
): Promise<WorkerDecryptionResult<Uint8Array>> => {
    const reverify = false;
    return getAndVerify(attachment, verification, messageKeys, reverify, api, getAttachment, onUpdateAttachment);
};

export const reverify = (
    attachment: Attachment = {},
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    getAttachment: (ID: string) => WorkerDecryptionResult<Uint8Array> | undefined,
    onUpdateAttachment: (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => void,
    api: Api
): Promise<WorkerDecryptionResult<Uint8Array>> => {
    const reverify = true;
    return getAndVerify(attachment, verification, messageKeys, reverify, api, getAttachment, onUpdateAttachment);
};
