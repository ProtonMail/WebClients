import {
    decryptMessage,
    DecryptResultPmcrypto,
    getMessage,
    getSignature,
    OpenPGPKey,
    SessionKey,
    VERIFICATION_STATUS,
} from 'pmcrypto';
import { getAttachment } from 'proton-shared/lib/api/attachments';
import { Api } from 'proton-shared/lib/interfaces';
import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { getSessionKey } from 'proton-shared/lib/mail/send/attachments';

import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { MessageExtended, MessageKeys } from '../../models/message';

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
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const getRequest = ({ ID = '' }: Attachment = {}, api: Api): Promise<ArrayBuffer> => {
    return api(getAttachment(ID));
};

export const getDecryptedAttachment = async (
    attachment: Attachment,
    message: MessageExtended,
    messageKeys: MessageKeys,
    api: Api
): Promise<DecryptResultPmcrypto> => {
    const encryptedBinary = await getRequest(attachment, api);
    try {
        const sessionKey = await getSessionKey(attachment, messageKeys.privateKeys);
        // verify attachment signature only when sender is verified
        const publicKeys = message.senderVerified ? message.senderPinnedKeys : undefined;
        return await decrypt(encryptedBinary, sessionKey, attachment.Signature, publicKeys);
    } catch (error) {
        // const blob = concatArrays([
        //     binaryStringToArray(decodeBase64(attachment.KeyPackets) || ''),
        //     new Uint8Array(encryptedBinary),
        // ]);
        // Fallback download raw attachment
        // throw { data: attachment, binary: blob, error };
        throw new Error('Error while decrypting attachment');
    }
};

export const getAndVerify = async (
    attachment: Attachment = {},
    message: MessageExtended,
    messageKeys: MessageKeys,
    reverify = false,
    cache: AttachmentsCache,
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

    if (!reverify && cache.has(attachmentID)) {
        attachmentdata = cache.get(attachmentID) as DecryptResultPmcrypto;
    } else {
        const isMIMEAttachment = !attachment.KeyPackets;
        // TODO: implement reverification of MIME attachment
        attachmentdata = isMIMEAttachment
            ? (cache.get(attachmentID) as DecryptResultPmcrypto)
            : await getDecryptedAttachment(attachment, message, messageKeys, api);
    }

    cache.set(attachmentID, attachmentdata);

    return attachmentdata;
};

export const get = (
    attachment: Attachment = {},
    message: MessageExtended,
    messageKeys: MessageKeys,
    cache: AttachmentsCache,
    api: Api
): Promise<DecryptResultPmcrypto> => {
    const reverify = false;
    return getAndVerify(attachment, message, messageKeys, reverify, cache, api);
};

export const reverify = (
    attachment: Attachment = {},
    message: MessageExtended,
    messageKeys: MessageKeys,
    cache: AttachmentsCache,
    api: Api
): Promise<DecryptResultPmcrypto> => {
    const reverify = true;
    return getAndVerify(attachment, message, messageKeys, reverify, cache, api);
};
