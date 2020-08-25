import {
    binaryStringToArray,
    concatArrays,
    decodeBase64,
    decryptMessage,
    DecryptResultPmcrypto,
    decryptSessionKey,
    getMessage,
    getSignature,
    OpenPGPKey,
    SessionKey,
    VERIFICATION_STATUS
} from 'pmcrypto';
import { Api } from 'proton-shared/lib/interfaces';

import { getAttachment } from '../../api/attachments';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { Attachment } from '../../models/attachment';
import { MessageExtended } from '../../models/message';

// Reference: Angular/src/app/attachments/services/AttachmentLoader.js

// TODO: Handle isOutside()

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
            format: 'binary'
        });
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const getRequest = ({ ID = '' }: Attachment = {}, api: Api): Promise<ArrayBuffer> => {
    // if (isOutside()) {
    //     const decryptedToken = eoStore.getToken();
    //     const token = $stateParams.tag;
    //     return Eo.attachment(decryptedToken, token, ID);
    // }

    return api(getAttachment(ID));
};

export const getSessionKey = async (attachment: Attachment, message: MessageExtended): Promise<SessionKey> => {
    // if (attachment.sessionKey) {
    //     return attachment;
    // }

    const keyPackets = binaryStringToArray(decodeBase64(attachment.KeyPackets) || '');
    const options = { message: await getMessage(keyPackets), privateKeys: message.privateKeys as any };

    // if (isOutside()) {
    //     options.passwords = [eoStore.getPassword()];
    // } else {
    //     options.privateKeys = keysModel.getPrivateKeys(message.AddressID);
    // }

    const sessionKey = await decryptSessionKey(options);

    if (sessionKey === undefined) {
        throw new Error('Error while decrypting session keys');
    }

    return sessionKey;
};

export const getDecryptedAttachment = async (
    attachment: Attachment,
    message: MessageExtended,
    api: Api
): Promise<DecryptResultPmcrypto> => {
    const encryptedBinary = await getRequest(attachment, api);
    try {
        const sessionKey = await getSessionKey(attachment, message);
        // verify attachment signature only when sender is verified
        const publicKeys = message.senderVerified ? message.senderPinnedKeys : undefined;
        return await decrypt(encryptedBinary, sessionKey, attachment.Signature, publicKeys);
    } catch (error) {
        const blob = concatArrays([
            binaryStringToArray(decodeBase64(attachment.KeyPackets) || ''),
            new Uint8Array(encryptedBinary)
        ]);
        // Fallback download raw attachment
        throw { data: attachment, binary: blob, error };
    }
};

export const getAndVerify = async (
    attachment: Attachment = {},
    message: MessageExtended,
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
            verified: VERIFICATION_STATUS.NOT_SIGNED
        };
    }

    if (!reverify && cache.has(attachmentID)) {
        attachmentdata = cache.get(attachmentID) as DecryptResultPmcrypto;
    } else {
        attachmentdata = await getDecryptedAttachment(attachment, message, api);
    }

    cache.set(attachmentID, attachmentdata);

    return attachmentdata;
};

export const get = (
    attachment: Attachment = {},
    message: MessageExtended,
    cache: AttachmentsCache,
    api: Api
): Promise<DecryptResultPmcrypto> => {
    const reverify = false;
    return getAndVerify(attachment, message, reverify, cache, api);
};

export const reverify = (
    attachment: Attachment = {},
    message: MessageExtended,
    cache: AttachmentsCache,
    api: Api
): Promise<DecryptResultPmcrypto> => {
    const reverify = true;
    return getAndVerify(attachment, message, reverify, cache, api);
};
