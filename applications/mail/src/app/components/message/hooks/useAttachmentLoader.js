import { useCache, useApi } from 'react-components';
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

const getCacheKey = ({ ID }) => `Attachment.${ID}`;

// TODO: Handle isOutside()
// TODO: Use a segmented cache like here react-components/hooks/useGetAddressKeys.js
// TODO: Restore SignatureVerifier

export const useAttachmentLoader = () => {
    const cache = useCache();
    const api = useApi();

    const decrypt = async (attachment, sessionKey = {}) => {
        console.log('decrypt', attachment, sessionKey);

        // create new Uint8Array to store decrypted attachment
        const at = new Uint8Array(attachment);

        try {
            // decrypt the att
            const { data, signatures } = await decryptMessage({
                message: await getMessage(at),
                sessionKeys: [sessionKey],
                format: 'binary'
            });

            console.log('here', data, signatures);

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

    const getRequest = ({ ID } = {}) => {
        // if (isOutside()) {
        //     const decryptedToken = eoStore.getToken();
        //     const token = $stateParams.tag;
        //     return Eo.attachment(decryptedToken, token, ID);
        // }

        // return attachmentApi.get(ID);
        return api(getAttachment(ID));
    };

    const getSessionKey = async (message, attachment) => {
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

    const getDecryptedAttachmentAPI = async (message, attachment) => {
        const data = await getRequest(attachment);
        // console.log('response', response);
        // const data = null;
        try {
            const { sessionKey } = await getSessionKey(message, attachment);
            const decrypted = await decrypt(data, sessionKey);
            console.log('getDecryptedAttachmentAPI', decrypted, getCacheKey(attachment));
            cache.set(getCacheKey(attachment), decrypted);
            return decrypted;
        } catch (error) {
            const blob = concatArrays([binaryStringToArray(decodeBase64(attachment.KeyPackets)), new Uint8Array(data)]);
            // Fallback download raw attachment
            return Promise.reject({ data: blob, error });
        }
    };

    const getDecryptedAttachment = async (message, attachment) => {
        const cadata = cache.get(getCacheKey(attachment));
        if (cadata) {
            return { ...cadata, fromCache: true };
        }
        return getDecryptedAttachmentAPI(message, attachment);
    };

    const getAndVerify = async (attachment = {}, message = {}, reverify = false) => {
        console.log('useAttachmentLoader.getAndVerify', attachment, message, reverify);

        if (attachment.Preview) {
            return attachment.Preview;
        }
        const { data, /*signatures, */ fromCache } = await getDecryptedAttachment(message, attachment);
        if (fromCache && !reverify) {
            return data;
        }

        console.log('useAttachmentLoader.getAndVerify result', data);

        // await SignatureVerifier.verify(attachment, data, message, signatures);

        return data;
    };

    const get = (attachment = {}, message = {}) => getAndVerify(attachment, message, false);

    const reverify = (attachment = {}, message = {}) => getAndVerify(attachment, message, true);

    const has = (attachment = {}) => {
        console.log('useAttachmentLoader.has', attachment);
        // !!cache.get(getCacheKey(attachment));
        return true;
    };

    return { get, reverify, has };
};
