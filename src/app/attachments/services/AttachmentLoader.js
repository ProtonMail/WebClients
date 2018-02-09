/* @ngInject */
function AttachmentLoader($cacheFactory, $log, $q, pmcw, authentication, $state, $stateParams, Eo, secureSessionStorage, attachmentApi) {
    const cache = $cacheFactory('attachments');
    const getCacheKey = ({ ID }) => `attachment.${ID}`;
    const isOutside = () => $state.is('eo.message') || $state.is('eo.reply');

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
    const decrypt = (attachment, pubKey, sessionKey = {}) => {
        // create new Uint8Array to store decrypted attachment
        const at = new Uint8Array(attachment);
        // decrypt the att
        return pmcw
            .decryptMessage({
                message: pmcw.getMessage(at),
                sessionKey,
                format: 'binary',
                publicKeys: pubKey ? pmcw.getKeys(pubKey) : []
            })
            .then(({ data }) => data)
            .catch((err) => ($log.error(err), err));
    };

    const encrypt = (attachment, publicKeys, privateKeys, { name, type, size, inline } = {}) => {
        const data = new Uint8Array(attachment);
        return pmcw
            .encryptMessage({
                passwords: [],
                filename: name,
                armor: false,
                data,
                publicKeys: pmcw.getKeys(publicKeys),
                privateKeys
            })
            .then(({ message }) => {
                const { asymmetric, encrypted } = pmcw.splitMessage(message);
                return {
                    Filename: name,
                    MIMEType: type,
                    FileSize: size,
                    Inline: inline,
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
            options.password = pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));
        } else {
            options.privateKeys = authentication.getPrivateKeys(message.AddressID);
        }
        return pmcw.decryptSessionKey(options).then((sessionKey) => angular.extend({}, attachment, { sessionKey }));
    };

    /**
     * Find an attachment for a message
     * @param  {Object} attachment
     * @param  {Object} message
     * @return {Promise}            Return decrypted attachment
     */
    const get = async (attachment = {}, message = {}) => {
        if (cache.get(`attachment.${attachment.ID}`)) {
            return cache.get(getCacheKey(attachment));
        }

        if (attachment.Preview) {
            return attachment.Preview;
        }

        const pubKeys = null;

        const { data } = await getRequest(attachment);
        try {
            // Will crash if there is a decryption error
            const { sessionKey } = await getSessionKey(message, attachment);
            const buffer = await decrypt(data, pubKeys, sessionKey);
            cache.put(getCacheKey(attachment), buffer);
            return buffer;
        } catch (error) {
            const blob = pmcw.concatArrays([pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets)), new Uint8Array(data)]);
            // Fallback download raw attachment
            return Promise.reject({ data: blob, error });
        }
    };

    const flushCache = () => cache.removeAll();

    return { get, load, flushCache, getSessionKey };
}
export default AttachmentLoader;
