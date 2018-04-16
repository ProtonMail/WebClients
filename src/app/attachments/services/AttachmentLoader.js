import _ from 'lodash';

/* @ngInject */
function AttachmentLoader(
    dispatchers,
    $cacheFactory,
    $log,
    $q,
    pmcw,
    authentication,
    $state,
    $stateParams,
    Eo,
    secureSessionStorage,
    attachmentApi,
    SignatureVerifier
) {
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
        cache.put(getCacheKey(attachment), { data: data });
    };

    /**
     * Get the source request for an attachment
     * @param  {String} options.ID  Attachment's ID
     * @return {$http}
     */
    const getRequest = ({ ID } = {}) => {
        if (isOutside()) {
            const decryptedToken = secureSessionStorage.getItem('proton:decrypted_token');
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
    const decrypt = (attachment, sessionKey = {}) => {
        // create new Uint8Array to store decrypted attachment
        const at = new Uint8Array(attachment);
        // decrypt the att
        return pmcw
            .decryptMessage({
                message: pmcw.getMessage(at),
                sessionKeys: [sessionKey],
                format: 'binary'
            })
            .then(({ data, signatures }) => ({
                data,
                signatures,
                fromCache: false
            }))
            .catch((err) => ($log.error(err), err));
    };

    const encrypt = (attachment, publicKeys, privateKeys, { name, type, size, inline } = {}) => {
        const data = new Uint8Array(attachment);
        return pmcw
            .encryptMessage({
                passwords: [],
                filename: name,
                armor: false,
                detached: true,
                data,
                publicKeys: pmcw.getKeys(publicKeys),
                privateKeys
            })
            .then(({ message, signature }) => {
                const { asymmetric, encrypted } = pmcw.splitMessage(message);
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
            });
    };

    // read the file locally, and encrypt it. return the encrypted file.
    function load(file, pubKeys, privKey) {
        const deferred = $q.defer();
        const reader = new FileReader();

        if (!file) {
            return deferred.reject(new TypeError('You did not provide a file'));
        }

        reader.onloadend = () => {
            encrypt(reader.result, pubKeys, privKey, file)
                .then(deferred.resolve)
                .catch(() => deferred.reject('Failed to encrypt attachment. Please try again.'));
        };

        reader.readAsArrayBuffer(file);

        return deferred.promise;
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
    const getSessionKey = (message, attachment) => {
        if (attachment.sessionKey) {
            return Promise.resolve(attachment);
        }
        const keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));
        const options = { message: pmcw.getMessage(keyPackets) };
        if (isOutside()) {
            options.passwords = [pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'))];
        } else {
            options.privateKeys = authentication.getPrivateKeys(message.AddressID);
        }
        return pmcw.decryptSessionKey(options).then((sessionKey) => angular.extend({}, attachment, { sessionKey }));
    };

    const getDecryptedAttachmentAPI = async (message, attachment) => {
        const { data } = await getRequest(attachment);
        try {
            const { sessionKey } = await getSessionKey(message, attachment);

            const decrypted = await decrypt(data, sessionKey);
            cache.put(getCacheKey(attachment), decrypted);
            return decrypted;
        } catch (error) {
            const blob = pmcw.concatArrays([
                pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets)),
                new Uint8Array(data)
            ]);
            // Fallback download raw attachment
            return Promise.reject({ data: blob, error });
        }
    };

    const getDecryptedAttachment = async (message, attachment) => {
        const cadata = cache.get(getCacheKey(attachment));
        if (cadata) {
            return _.extend({ fromCache: true }, cadata);
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
