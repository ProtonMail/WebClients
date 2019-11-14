import {
    binaryStringToArray,
    concatArrays,
    decodeBase64,
    decryptMessage,
    decryptSessionKey,
    getMessage
} from 'pmcrypto';
import { getAttachment } from '../api/attachments';

// Reference: Angular/src/app/attachments/services/AttachmentLoader.js

// TODO: Handle isOutside()

// export const getCacheKey = ({ ID }) => `Attachment.${ID}`;
export const getCacheKey = ({ ID }) => ID;

export const decrypt = async (attachment, sessionKey = {}) => {
    // create new Uint8Array to store decrypted attachment
    const at = new Uint8Array(attachment);

    try {
        // decrypt the att
        const { data, signatures } = await decryptMessage({
            message: await getMessage(at),
            sessionKeys: [sessionKey],
            format: 'binary'
        });

        return {
            data,
            signatures,
            fromCache: false
        };
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const getRequest = ({ ID } = {}, api) => {
    // if (isOutside()) {
    //     const decryptedToken = eoStore.getToken();
    //     const token = $stateParams.tag;
    //     return Eo.attachment(decryptedToken, token, ID);
    // }

    // return attachmentApi.get(ID);
    return api(getAttachment(ID));
};

export const getSessionKey = async (message, attachment) => {
    if (attachment.sessionKey) {
        return attachment;
    }

    const keyPackets = binaryStringToArray(decodeBase64(attachment.KeyPackets));
    const options = { message: await getMessage(keyPackets) };

    // if (isOutside()) {
    //     options.passwords = [eoStore.getPassword()];
    // } else {
    // console.log('getSessionKey', message);
    // options.privateKeys = keysModel.getPrivateKeys(message.AddressID);
    options.privateKeys = message.privateKeys;
    // }

    const sessionKey = await decryptSessionKey(options);

    return { ...attachment, sessionKey };
};

export const getDecryptedAttachmentAPI = async (message, attachment, { cache, api }) => {
    const data = await getRequest(attachment, api);
    // console.log('response', response);
    // const data = null;
    try {
        const { sessionKey } = await getSessionKey(message, attachment);
        const decrypted = await decrypt(data, sessionKey);
        cache.set(getCacheKey(attachment), decrypted);
        return decrypted;
    } catch (error) {
        const blob = concatArrays([binaryStringToArray(decodeBase64(attachment.KeyPackets)), new Uint8Array(data)]);
        // Fallback download raw attachment
        return Promise.reject({ data: blob, error });
    }
};

export const getDecryptedAttachment = async (message, attachment, { cache, api }) => {
    const cadata = cache.get(getCacheKey(attachment));
    if (cadata) {
        return { ...cadata, fromCache: true };
    }
    return getDecryptedAttachmentAPI(message, attachment, { cache, api });
};

export const getAndVerify = async (attachment = {}, message = {}, reverify = false, { cache, api, verify }) => {
    if (attachment.Preview) {
        return attachment.Preview;
    }
    const { data, signatures, fromCache } = await getDecryptedAttachment(message, attachment, { cache, api });
    if (fromCache && !reverify) {
        return data;
    }

    await verify(attachment, data, message, signatures);

    return data;
};
