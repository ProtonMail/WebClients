import {
    binaryStringToArray,
    concatArrays,
    decodeBase64,
    decryptMessage,
    decryptSessionKey,
    encryptMessage,
    getKeys,
    getMessage,
    splitMessage
} from 'pmcrypto';

import { readFileAsBuffer } from '../../../helpers/fileHelper';

/* @ngInject */
function AttachmentLoader(
    dispatchers,
    $cacheFactory,
    keysModel,
    $state,
    $stateParams,
    Eo,
    eoStore,
    attachmentApi,
    SignatureVerifier,
    gettextCatalog,
    translator
) {
    const I18N = translator(() => ({
        encrypt: gettextCatalog.getString('Failed to encrypt attachment. Please try again.', null, 'Error'),
        missing: gettextCatalog.getString('You did not provide a file.', null, 'Error')
    }));

    const { dispatcher } = dispatchers(['attachmentLoader']);
    const cache = $cacheFactory('attachments');
    const getCacheKey = ({ ID }) => `attachment.${ID}`;
    const isOutside = () => $state.is('eo.message') || $state.is('eo.reply');

    /**
     * We need to expose this to be able to store PGP attachments inside the attachmentLoader cache.
     * Otherwise we would have to store it inside the attachment itself or build another cache which could introduce
     * memory leaks.
     */
    const put = (attachment, data, verified = null) => {
        if (verified !== null) {
            SignatureVerifier.put(attachment.ID, verified);
        }
        cache.put(getCacheKey(attachment), { data });
    };

    /**
     * Get the source request for an attachment
     * @param  {String} options.ID  Attachment's ID
     * @return {$http}
     */
    const getRequest = ({ ID } = {}) => {
        if (isOutside()) {
            const decryptedToken = eoStore.getToken();
            const token = $stateParams.tag;
            return Eo.attachment(decryptedToken, token, ID);
        }

        return attachmentApi.get(ID);
    };

    /**
     * Decrypt an attachment
     * @param  {ArrayBuffer} attachment
     * @param  {String} options.key
     * @param  {String} options.algo
     * @return {Promise}
     */
    const decrypt = async (attachment, sessionKey = {}) => {
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

    const encrypt = async (data, publicKeys, privateKeys, { name, type, size, inline } = {}) => {
        const { message, signature } = await encryptMessage({
            filename: name,
            armor: false,
            detached: true,
            data,
            publicKeys: await getKeys(publicKeys),
            privateKeys
        });

        const { asymmetric, encrypted } = await splitMessage(message);

        return {
            Filename: name,
            MIMEType: type,
            FileSize: size,
            Inline: inline,
            signature: signature ? signature.packets.write() : undefined,
            Preview: data,
            keys: asymmetric[0],
            data: encrypted[0]
        };
    };

    // read the file locally, and encrypt it. return the encrypted file.
    async function load(file, pubKeys, privKey) {
        if (!file) {
            throw new TypeError(I18N.missing);
        }
        try {
            const result = await readFileAsBuffer(file);
            return encrypt(new Uint8Array(result), pubKeys, privKey, file);
        } catch (e) {
            throw new Error(I18N.encrypt);
        }
    }

    /**
     * Get the sessionKey for an attachment,
     * if there is no sessionKey:
     *     - Loading a draft with attachments,
     *     - Reply with embedded
     * @param  {Message} message
     * @param  {Object} attachment
     * @return {Promise}   With the attachment containing the sessionKey (no-sideeffects)
     */
    const getSessionKey = async (message, attachment) => {
        if (attachment.sessionKey) {
            return attachment;
        }

        const keyPackets = binaryStringToArray(decodeBase64(attachment.KeyPackets));
        const options = { message: await getMessage(keyPackets) };

        if (isOutside()) {
            options.passwords = [eoStore.getPassword()];
        } else {
            options.privateKeys = keysModel.getPrivateKeys(message.AddressID);
        }

        const sessionKey = await decryptSessionKey(options);

        return { ...attachment, sessionKey };
    };

    const getDecryptedAttachmentAPI = async (message, attachment) => {
        const { data } = await getRequest(attachment);
        try {
            const { sessionKey } = await getSessionKey(message, attachment);

            const decrypted = await decrypt(data, sessionKey);
            cache.put(getCacheKey(attachment), decrypted);
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

    const has = (attachment = {}) => !!cache.get(getCacheKey(attachment));

    /**
     * Find an attachment for a message
     * @param  {Object} attachment
     * @param  {Object} message
     * @return {Promise}            Return decrypted attachment
     */
    const getAndVerify = async (attachment = {}, message = {}, reverify = false) => {
        if (attachment.Preview) {
            return attachment.Preview;
        }
        const { data, signatures, fromCache } = await getDecryptedAttachment(message, attachment);
        if (fromCache && !reverify) {
            return data;
        }

        await SignatureVerifier.verify(attachment, data, message, signatures);
        dispatcher.attachmentLoader('download', { message, attachment });
        return data;
    };

    const get = (attachment = {}, message = {}) => getAndVerify(attachment, message, false);

    const reverify = (attachment = {}, message = {}) => getAndVerify(attachment, message, true);

    const flushCache = () => cache.removeAll();

    return { put, get, reverify, load, has, flushCache, getSessionKey };
}
export default AttachmentLoader;
