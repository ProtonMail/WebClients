angular.module('proton.attachments')
    .factory('AttachmentLoader', ($cacheFactory, $log, $q, pmcw, authentication, $state, $stateParams, Eo, secureSessionStorage, attachmentApi) => {

        const isFileSaverSupported = !!(('download' in document.createElement('a')) || navigator.msSaveOrOpenBlob);
        const cache = $cacheFactory('attachments');
        const getCacheKey = ({ ID }) => `attachment.${ID}`;
        const isOutside = () => $state.is('eo.message') || $state.is('eo.reply');

        /**
         * Get the source request for an attachement
         * @param  {String} options.ID  Attachment's ID
         * @return {$http}
         */
        const getRequest = ({ ID } = {}) => {

            if (isOutside()) {
                const decrypted_token = secureSessionStorage.getItem('proton:decrypted_token');
                const token = $stateParams.tag;
                return Eo.attachment(decrypted_token, token, ID);
            }

            return attachmentApi.get(ID);
        };

        /**
         * Get the private keys to decrypt attachments base on the context
         * @param  {Object} message
         * @return {String}
         */
        const getPrivateKeys = (message) => {
            // get user's pk
            if (isOutside()) {
                return pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));
            }

            return authentication.getPrivateKeys(message.AddressID);
        };

        /**
         * Decrypt an attachment
         * @param  {ArrayBuffer} attachment
         * @param  {String} options.key
         * @param  {String} options.algo
         * @return {Promise}
         */
        const decrypt = (attachment, { key, algo } = {}) => {

            // create new Uint8Array to store decryted attachment
            let at = new Uint8Array(attachment);
            // decrypt the att
            return pmcw
                .decryptMessage(at, key, true, algo)
                .then(({ data }) => (at = null, data))
                .catch((err) => ($log.error(err), err));
        };

        const encrypt = (attachment, pubKeys, { name, type, size, inline } = {} ) => {

            const at = new Uint8Array(attachment);
            return pmcw
                .encryptFile(at, pubKeys, [], name)
                .then((packets) => angular.extend({}, packets, {
                    Filename: name,
                    MIMEType: type,
                    FileSize: size,
                    Inline: inline,
                    Preview: at
                }))
                .catch((err) => {
                    $log.error(err);
                    throw err;
                });
        };

        // read the file locally, and encrypt it. return the encrypted file.
        function load(file, pubKeys) {

            const deferred = $q.defer();
            const reader = new FileReader();

            if (!file) {
                return deferred.reject(new TypeError("You did not provide a file"));
            }

            reader.onloadend = (event) => {
                encrypt(reader.result, pubKeys, file)
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
         *  It creates the sessionKey and bind it to the attachment
         * @param  {Message} message
         * @param  {Object} attachment
         * @param  {Array} keyPackets
         * @return {Promise}
         */
        const getSessionKey = (message, attachment, keyPackets) => {
            if (attachment.sessionKey) {
                return Promise.resolve(attachment.sessionKey);
            }

            return pmcw
                .decryptSessionKey(keyPackets, getPrivateKeys(message))
                .then((sessionKey) => {
                    attachment.sessionKey = sessionKey;
                    return sessionKey;
                });
        };

        /**
         * Find an attachment for a message
         * @param  {Object} attachment
         * @param  {Object} message
         * @return {Promise}            Return decrypted attachment
         */
        const get = (attachment = {}, message = {}) => {

            if (cache.get(`attachment.${attachment.ID}`)) {
                return Promise.resolve(cache.get(getCacheKey(attachment)));
            }

            const request = getRequest(attachment);
            const keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));
            const key = getSessionKey(message, attachment, keyPackets);

            return Promise.all([request, key])
                .then(([{ data }, key]) => decrypt(data, key))
                .then((data) => (cache.put(getCacheKey(attachment), data), data))
                .catch((err) => {
                    console.log(err);
                    throw err;
                });
        };

        /**
         * Generate a download for an attachment
         * @param  {Object} attachment
         * @return {void}
         */
        const generateDownload = (attachment) => {
            try {
                var blob = new Blob([attachment.data], {type: attachment.MIMEType});

                if (isFileSaverSupported) {
                    return saveAs(blob, attachment.Name);
                }

                // Bad blob support, make a data URI, don't click it
                const reader = new FileReader();

                reader.onloadend = function () {
                    attachment.el.href = reader.result;
                };

                reader.readAsDataURL(blob);
            } catch (error) {
                $log.error(error);
            }
        };

        const flushCache = () => cache.removeAll();

        return { get, load, flushCache, generateDownload };
    });
