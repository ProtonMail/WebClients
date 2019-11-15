import {
    binaryStringToArray,
    concatArrays,
    decodeBase64,
    decryptMessage,
    decryptSessionKey,
    getMessage
} from 'pmcrypto';
import JSZip from 'jszip';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
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

    verify && (await verify(attachment, data, message, signatures));

    return data;
};

/**
 * Format attachment for the download
 * @param  {Object} attachment
 * @param  {Object} message    Message
 * @param  {Node} el         Link clicked
 * @return {Promise}
 */
const formatDownload = async (attachment, message, { cache, api }) => {
    console.log('formatDownload', attachment);
    try {
        const data = await getAndVerify(attachment, message, false, { cache, api });
        return {
            data,
            Name: attachment.Name,
            MIMEType: attachment.MIMEType,
            ID: attachment.ID
        };
    } catch (e) {
        // If the decryption fails we download the encrypted version
        console.log('error', e);
        if (e.data) {
            return {
                data: e.data,
                Name: `${attachment.Name}.pgp`,
                MIMEType: 'application/pgp',
                isError: true,
                ID: attachment.ID
            };
        }
        throw e;
    }
};

/**
 * Generate a download for an attachment
 * @param  {Object} attachment
 * @return {void}
 */
const generateDownload = async (message, attachment) => {
    // TODO: uncomment
    // try {
    //     await checkAllSignatures(message, [attachment]);
    // } catch (e) {
    //     // swallow as the user is informed already by a confirmation and actually caused this error
    //     return;
    // }

    downloadFile(new Blob([attachment.data], { type: attachment.MIMEType }), attachment.Name);
};

/**
 * Download an attachment
 * @param  {Object} attachment
 * @param  {Message} message
 * @param  {Node} el
 * @return {Promise}
 */
export const download = async (attachment, message, { cache, api }) => {
    const att = await formatDownload(attachment, message, { cache, api });

    // TODO: uncomment
    // if (att.isError) {
    //     if (!(await allowDownloadBrokenAtt())) {
    //         return; // We don't want to download it
    //     }
    // }

    return generateDownload(message, att);
};

/**
 * The attachment's Name is not uniq we need a uniq name in order
 * to make the zip. The lib doesn't allow duplicates
 * @param  {Message} message
 * @return {Array}         Array of promises
 */
const formatDownloadAll = async (message, { cache, api }) => {
    const { Attachments = [] } = message.data;
    const { list } = Attachments.reduce(
        (acc, att) => {
            if (!acc.map[att.Name]) {
                acc.map[att.Name] = { index: 0 };
            } else {
                acc.map[att.Name].index++;
                // We can have an extension
                const name = att.Name.split('.');
                const ext = name.pop();
                const newName = `${name.join('.')} (${acc.map[att.Name].index}).${ext}`;
                att.Name = newName;
            }
            acc.list.push(att);
            return acc;
        },
        { list: [], map: {} }
    );

    return Promise.all(list.map((att) => formatDownload(att, message, { cache, api })));
};

const getZipAttachmentName = (message) => `Attachments-${message.Subject}.zip`;

/**
 * Download all attachments as a zipfile
 * @param  {Object} message Message
 * @param  {Node} el      link clicked
 * @return {Promise}         Always success
 */
export const downloadAll = async (message = {}, { cache, api }) => {
    const list = await formatDownloadAll(message, { cache, api });

    // TODO: uncomment
    // try {
    //     await checkAllSignatures(message, list);
    // } catch (e) {
    //     // swallow as the user is informed already by a confirmation and actually caused this error
    //     return;
    // }

    // TODO: uncomment
    // // Detect if we have at least one error
    // if (list.some(({ isError }) => isError)) {
    //     if (!(await allowDownloadBrokenAtt())) {
    //         return; // We don't want to download it
    //     }
    // }

    const zip = new JSZip();
    list.forEach(({ Name, data }) => zip.file(Name, data));
    const content = await zip.generateAsync({ type: 'blob' });
    console.log('coucou', getZipAttachmentName(message.data));
    downloadFile(content, getZipAttachmentName(message.data));
};
