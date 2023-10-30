import { CryptoProxy, PublicKeyReference, SessionKey, WorkerDecryptionResult } from '@proton/crypto';
import { binaryStringToArray, decodeBase64 } from '@proton/crypto/lib/utils';
import { getAttachment } from '@proton/shared/lib/api/attachments';
import { getEOAttachment } from '@proton/shared/lib/api/eo';
import { Api } from '@proton/shared/lib/interfaces';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { getEOSessionKey, getSessionKey } from '@proton/shared/lib/mail/send/attachments';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { MessageKeys, MessageVerification } from '../../logic/messages/messagesTypes';

export const getVerificationStatusFromKeys = (
    decryptedAttachment: WorkerDecryptionResult<Uint8Array>,
    verifyingKeys: PublicKeyReference[]
) => {
    return verifyingKeys.length > 0 ? decryptedAttachment.verified : VERIFICATION_STATUS.NOT_VERIFIED;
};

// Reference: Angular/src/app/attachments/services/AttachmentLoader.js
export const decryptAndVerify = async (
    encryptedBinaryBuffer: ArrayBuffer,
    sessionKey: SessionKey,
    signature?: string,
    publicKeys?: PublicKeyReference | PublicKeyReference[],
    encSignature?: string
): Promise<WorkerDecryptionResult<Uint8Array>> => {
    const encryptedBinary = new Uint8Array(encryptedBinaryBuffer);

    try {
        return await CryptoProxy.decryptMessage({
            binaryMessage: encryptedBinary,
            sessionKeys: [sessionKey],
            armoredSignature: signature,
            armoredEncryptedSignature: encSignature,
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
    api: Api,
    messageFlags?: number
): Promise<WorkerDecryptionResult<Uint8Array>> => {
    const isOutside = messageKeys.type === 'outside';
    const encryptedBinary = await getRequest(attachment, api, messageKeys);

    try {
        if (!isOutside) {
            const sessionKey = await getSessionKey(attachment, messageKeys.privateKeys, messageFlags);
            const decryptedAttachment = await decryptAndVerify(
                encryptedBinary,
                sessionKey,
                attachment.Signature,
                verification?.verifyingKeys
            );

            const verified = getVerificationStatusFromKeys(decryptedAttachment, verification?.verifyingKeys || []);

            return {
                ...decryptedAttachment,
                verified,
            } as WorkerDecryptionResult<Uint8Array>;
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
        const blob = mergeUint8Arrays([
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
    api: Api,
    getAttachment?: (ID: string) => WorkerDecryptionResult<Uint8Array> | undefined,
    onUpdateAttachment?: (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => void,
    messageFlags?: number
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
        } as WorkerDecryptionResult<Uint8Array>;
    }

    if (!isOutside && getAttachment && onUpdateAttachment) {
        const attachmentInState = getAttachment(attachmentID);
        if (attachmentInState) {
            attachmentdata = attachmentInState;
        } else {
            attachmentdata = await getDecryptedAttachment(attachment, verification, messageKeys, api, messageFlags);
        }
        onUpdateAttachment(attachmentID, attachmentdata);
    } else {
        attachmentdata = await getDecryptedAttachment(attachment, verification, messageKeys, api, messageFlags);
    }

    return attachmentdata;
};

export const get = (
    attachment: Attachment = {},
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    api: Api,
    getAttachment?: (ID: string) => WorkerDecryptionResult<Uint8Array> | undefined,
    onUpdateAttachment?: (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => void,
    messageFlags?: number
): Promise<WorkerDecryptionResult<Uint8Array>> => {
    return getAndVerify(attachment, verification, messageKeys, api, getAttachment, onUpdateAttachment, messageFlags);
};
