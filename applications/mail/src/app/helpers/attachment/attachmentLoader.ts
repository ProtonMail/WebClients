import {
    decryptMessage,
    DecryptResultPmcrypto,
    getMessage,
    getSignature,
    OpenPGPKey,
    SessionKey,
    VERIFICATION_STATUS,
    binaryStringToArray,
    concatArrays,
} from 'pmcrypto';
import { getAttachment } from '@proton/shared/lib/api/attachments';
import { decodeBase64 } from '@proton/shared/lib/helpers/base64';
import { Api } from '@proton/shared/lib/interfaces';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getSessionKey } from '@proton/shared/lib/mail/send/attachments';
import { MessageKeys, MessageVerification } from '../../models/message';

// Reference: Angular/src/app/attachments/services/AttachmentLoader.js

export const decrypt = async (
    encryptedBinaryBuffer: ArrayBuffer,
    sessionKey: SessionKey,
    signature?: string,
    publicKeys?: OpenPGPKey | OpenPGPKey[]
): Promise<DecryptResultPmcrypto & { data: Uint8Array | ReadableStream<Uint8Array> }> => {
    const encryptedBinary = new Uint8Array(encryptedBinaryBuffer);

    try {
        return decryptMessage({
            message: await getMessage(encryptedBinary),
            sessionKeys: [sessionKey],
            signature: signature ? await getSignature(signature) : undefined,
            publicKeys,
            format: 'binary',
        });
    } catch (err: any) {
        console.error(err);
        throw err;
    }
};

export const getRequest = ({ ID = '' }: Attachment = {}, api: Api): Promise<ArrayBuffer> => {
    return api(getAttachment(ID));
};

export const getDecryptedAttachment = async (
    attachment: Attachment,
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    api: Api
): Promise<DecryptResultPmcrypto> => {
    const encryptedBinary = await getRequest(attachment, api);
    try {
        const sessionKey = await getSessionKey(attachment, messageKeys.privateKeys);
        // verify attachment signature only when sender is verified
        const publicKeys = verification?.senderVerified ? verification.senderPinnedKeys : undefined;
        return await decrypt(encryptedBinary, sessionKey, attachment.Signature, publicKeys);
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
    getAttachment: (ID: string) => DecryptResultPmcrypto | undefined,
    onUpdateAttachment: (ID: string, attachment: DecryptResultPmcrypto) => void,
    api: Api
): Promise<DecryptResultPmcrypto> => {
    let attachmentdata: DecryptResultPmcrypto;

    const attachmentID = attachment.ID || '';

    if (attachment.Preview) {
        return {
            data: attachment.Preview,
            filename: 'preview',
            signatures: [],
            verified: VERIFICATION_STATUS.NOT_SIGNED,
        };
    }

    const attachmentInState = getAttachment(attachmentID);

    if (!reverify && attachmentInState) {
        attachmentdata = attachmentInState;
    } else {
        const isMIMEAttachment = !attachment.KeyPackets;
        // TODO: implement reverification of MIME attachment
        attachmentdata = isMIMEAttachment
            ? (attachmentInState as DecryptResultPmcrypto)
            : await getDecryptedAttachment(attachment, verification, messageKeys, api);
    }

    onUpdateAttachment(attachmentID, attachmentdata);

    return attachmentdata;
};

export const get = (
    attachment: Attachment = {},
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    getAttachment: (ID: string) => DecryptResultPmcrypto | undefined,
    onUpdateAttachment: (ID: string, attachment: DecryptResultPmcrypto) => void,
    api: Api
): Promise<DecryptResultPmcrypto> => {
    const reverify = false;
    return getAndVerify(attachment, verification, messageKeys, reverify, getAttachment, onUpdateAttachment, api);
};

export const reverify = (
    attachment: Attachment = {},
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    getAttachment: (ID: string) => DecryptResultPmcrypto | undefined,
    onUpdateAttachment: (ID: string, attachment: DecryptResultPmcrypto) => void,
    api: Api
): Promise<DecryptResultPmcrypto> => {
    const reverify = true;
    return getAndVerify(attachment, verification, messageKeys, reverify, getAttachment, onUpdateAttachment, api);
};
