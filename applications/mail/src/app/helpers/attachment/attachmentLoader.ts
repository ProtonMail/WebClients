import type { PublicKeyReference, SessionKey, WorkerDecryptionResult } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { binaryStringToArray, decodeBase64 } from '@proton/crypto/lib/utils';
import type { MessageKeys, MessageVerification } from '@proton/mail/store/messages/messagesTypes';
import { getAttachment } from '@proton/shared/lib/api/attachments';
import { getEOAttachment } from '@proton/shared/lib/api/eo';
import { traceError } from '@proton/shared/lib/helpers/sentry';
import type { Api } from '@proton/shared/lib/interfaces';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { getEOSessionKey, getSessionKey } from '@proton/shared/lib/mail/send/attachments';
import { getMailVerificationStatus } from '@proton/shared/lib/mail/signature';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import type { DecryptedAttachment } from '../../store/attachments/attachmentsTypes';

export const getVerificationStatusFromKeys = (
    decryptedAttachment: WorkerDecryptionResult<Uint8Array<ArrayBuffer>>,
    verifyingKeys: PublicKeyReference[]
): MAIL_VERIFICATION_STATUS => {
    return verifyingKeys.length > 0
        ? getMailVerificationStatus(decryptedAttachment.verificationStatus)
        : MAIL_VERIFICATION_STATUS.NOT_VERIFIED;
};

// Reference: Angular/src/app/attachments/services/AttachmentLoader.js
export const decryptAndVerify = async (
    encryptedBinaryBuffer: ArrayBuffer,
    sessionKey: SessionKey,
    signature?: string,
    publicKeys?: PublicKeyReference | PublicKeyReference[],
    encSignature?: string
): Promise<WorkerDecryptionResult<Uint8Array<ArrayBuffer>>> => {
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
): Promise<DecryptedAttachment> => {
    const isOutside = messageKeys.type === 'outside';
    const encryptedBinary = await getRequest(attachment, api, messageKeys);

    try {
        if (!isOutside) {
            const sessionKey = await getSessionKey(attachment, messageKeys.decryptionKeys, messageFlags);
            const decryptedAttachment = await decryptAndVerify(
                encryptedBinary,
                sessionKey,
                attachment.Signature,
                verification?.verifyingKeys
            );

            const verificationStatus = getVerificationStatusFromKeys(
                decryptedAttachment,
                verification?.verifyingKeys || []
            );

            return {
                ...decryptedAttachment,
                verificationStatus,
            };
        }
        const sessionKey = await getEOSessionKey(attachment, messageKeys.password);

        const decryptionResult = await CryptoProxy.decryptMessage({
            binaryMessage: new Uint8Array(encryptedBinary),
            passwords: [messageKeys.password],
            format: 'binary',
            sessionKeys: [sessionKey],
        });
        return {
            ...decryptionResult,
            verificationStatus: getMailVerificationStatus(decryptionResult.verificationStatus),
        };
    } catch (error: any) {
        traceError(error, {
            extra: {
                isEncryptedOutside: isOutside,
            },
            tags: {
                initiative: 'attachment-decryption-error',
            },
        });
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

export const getAndVerifyAttachment = async (
    attachment: Attachment = {},
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    api: Api,
    getAttachment?: (ID: string) => DecryptedAttachment | undefined,
    onUpdateAttachment?: (ID: string, attachment: DecryptedAttachment) => void,
    messageFlags?: number
): Promise<DecryptedAttachment> => {
    const isOutside = messageKeys.type === 'outside';
    let attachmentdata: DecryptedAttachment;

    const attachmentID = attachment.ID || '';

    if (attachment.Preview) {
        return {
            data: attachment.Preview,
            filename: 'preview',
            signatures: [],
            verificationStatus: MAIL_VERIFICATION_STATUS.NOT_SIGNED,
        };
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
