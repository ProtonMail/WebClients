import {
    binaryStringToArray,
    concatArrays,
    decodeBase64,
    decryptMessage,
    decryptSessionKey,
    getMessage,
    SessionKey
} from 'pmcrypto';
import { DecryptResult } from 'openpgp';
import { Api } from 'proton-shared/lib/interfaces';

import { getAttachment } from '../../api/attachments';
import { MessageExtended } from '../../models/message';
import { Attachment } from '../../models/attachment';
import { AttachmentsCache } from '../../containers/AttachmentProvider';

// Reference: Angular/src/app/attachments/services/AttachmentLoader.js

// TODO: Handle isOutside()

export const decrypt = async (encryptedBinaryBuffer: ArrayBuffer, sessionKey: SessionKey): Promise<DecryptResult> => {
    const encryptedBinary = new Uint8Array(encryptedBinaryBuffer);

    try {
        return decryptMessage({
            message: await getMessage(encryptedBinary),
            sessionKeys: [sessionKey],
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
): Promise<DecryptResult> => {
    const encryptedBinary = await getRequest(attachment, api);
    try {
        const sessionKey = await getSessionKey(attachment, message);
        return await decrypt(encryptedBinary, sessionKey);
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
    message: MessageExtended = {},
    reverify = false,
    cache: AttachmentsCache,
    api: Api
): Promise<DecryptResult> => {
    let attachmentdata: DecryptResult;

    const attachmentID = attachment.ID || '';

    if (attachment.Preview) {
        return { data: attachment.Preview, filename: 'preview', signatures: [] };
    }

    if (cache.has(attachmentID)) {
        attachmentdata = cache.get(attachmentID) as DecryptResult;
    } else {
        attachmentdata = await getDecryptedAttachment(attachment, message, api);

        if (reverify) {
            // await verify(attachment, newAttachment, message, signatures, signatureCache));
        }
    }

    cache.set(attachmentID, attachmentdata);

    return attachmentdata;
};

export const get = (
    attachment: Attachment = {},
    message: MessageExtended = {},
    cache: AttachmentsCache,
    api: Api
): Promise<DecryptResult> => {
    const reverify = false;
    return getAndVerify(attachment, message, reverify, cache, api);
};

export const reverify = (
    attachment: Attachment = {},
    message: MessageExtended = {},
    cache: AttachmentsCache,
    api: Api
): Promise<DecryptResult> => {
    const reverify = true;
    return getAndVerify(attachment, message, reverify, cache, api);
};
