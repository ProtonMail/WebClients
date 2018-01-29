import _ from 'lodash';

/* @ngInject */
function attachmentApi($http, url, $q, $rootScope, authentication, pmcw, CONFIG, CONSTANTS, secureSessionStorage, gettextCatalog, notification) {
    let pendingUpload = [];
    const requestURL = url.build('attachments');

    const dispatch = (type, data) => $rootScope.$emit('attachment.upload', { type, data });

    const dispatchUpload = (REQUEST_ID, message, packet) => (progress, status, isStart = false) => {
        dispatch('uploading', {
            id: REQUEST_ID,
            messageID: message.ID,
            message,
            status,
            progress,
            packet,
            isStart
        });
    };

    /**
     * Parse the JSON coming from the XHR request
     * @param  {XMLHttpRequest} xhr
     * @return {Object}
     */
    const parseJSON = (xhr) => {
        const response = (json, isInvalid = false) => ({ json, isInvalid });
        try {
            return response(JSON.parse(xhr.responseText));
        } catch (e) {
            return response(
                {
                    Error: `JSON parsing error: ${xhr.responseText}`
                },
                true
            );
        }
    };

    /**
     * Build the formData to upload
     * @param  {Object} packets
     * @param  {Object} message
     * @return {FormData}
     */
    const makeFormUpload = (packets, message, tempPacket) => {
        const data = new FormData();
        data.append('Filename', packets.Filename);
        data.append('MessageID', message.ID);
        data.append('ContentID', tempPacket.ContentID);
        data.append('MIMEType', packets.MIMEType);
        data.append('Inline', packets.Inline);
        data.append('KeyPackets', new Blob([packets.keys]));
        data.append('DataPacket', new Blob([packets.data]));
        return data;
    };

    /**
     * Close a pending request and dispatch an action
     * @param  {Numer} options.id        Timestamp id for a request
     * @param  {String} options.messageID
     * @return {void}
     */
    function killUpload({ id, messageID }) {
        const upload = _.find(pendingUpload, { id, messageID });
        upload.request.abort();
        pendingUpload = pendingUpload.filter((up) => up.id !== id);
    }

    /**
     * Get an attachment by its ID
     * @param  {String} ID
     * @return {Promise}
     */
    const get = (ID) => $http.get(requestURL(ID), { responseType: 'arraybuffer' });

    const upload = (packets, message, tempPacket, total) => {
        const REQUEST_ID = `${Math.random()
            .toString(32)
            .slice(2, 12)}-${Date.now()}`;
        const dispatcher = dispatchUpload(REQUEST_ID, message, tempPacket);
        const deferred = $q.defer();
        const xhr = new XMLHttpRequest();
        const keys = authentication.getPrivateKeys(message.AddressID);

        // Check the network status of the app (XHR does not auto close)
        const unsubscribe = $rootScope.$on('AppModel', (e, { type, data = {} }) => {
            if (type === 'onLine' && !data.value) {
                xhr.abort();
            }
        });

        pendingUpload.push({
            id: REQUEST_ID,
            messageID: message.ID,
            packet: tempPacket,
            request: xhr
        });

        dispatcher(1, true, true);

        xhr.upload.onprogress = (event) => {
            const progress = event.loaded / event.total * 99;
            dispatcher(progress, true);
        };

        xhr.onerror = function onerror() {
            // remove the current request as it's resolved
            pendingUpload = _.reject(pendingUpload, {
                id: REQUEST_ID,
                messageID: message.ID
            });

            message.uploading = _.filter(pendingUpload, { messageID: message.ID }).length;

            dispatch('error', {
                id: REQUEST_ID,
                messageID: message.ID,
                message
            });

            deferred.resolve({ id: REQUEST_ID, isError: true });
            unsubscribe();
        };

        xhr.onabort = function onabort() {
            // remove the current request as it's resolved
            pendingUpload = _.reject(pendingUpload, {
                id: REQUEST_ID,
                messageID: message.ID
            });

            message.uploading = _.filter(pendingUpload, { messageID: message.ID }).length;

            dispatch('cancel', {
                id: REQUEST_ID,
                messageID: message.ID,
                message
            });

            deferred.resolve({ id: REQUEST_ID, isAborted: true });
            unsubscribe();
        };

        xhr.onload = function onload() {
            const { json, isInvalid } = parseJSON(xhr);

            const statusCode = this.status;
            unsubscribe();

            if (statusCode !== 200) {
                // Error with the request
                notification.error(gettextCatalog.getString('Unable to upload file. Please try again', null, 'Error'));
                return deferred.reject(json);
            }

            if (json.Error) {
                // isInvalid = false: Attachment disallowed by back-end size limit (no change in size)
                const msgError = !isInvalid ? json.Error : gettextCatalog.getString('Unable to upload file. Please try again', null, 'Error');

                notification.error(msgError);
                return deferred.reject(json);
            }

            dispatcher(100, false);
            dispatch('uploaded.success', {
                id: REQUEST_ID,
                messageID: message.ID,
                packet: tempPacket,
                total,
                message
            });

            // remove the current request as it's resolved
            pendingUpload = _.reject(pendingUpload, {
                id: REQUEST_ID,
                messageID: message.ID
            });

            const msg = pmcw.getMessage(packets.keys);
            pmcw
                .decryptSessionKey({ message: msg, privateKeys: keys })
                .then((sessionKey) => ({
                    REQUEST_ID,
                    sessionKey,
                    attachment: _.extend({}, json.Attachment || {}, { sessionKey })
                }))
                .then(deferred.resolve)
                .catch(deferred.reject);
        };

        xhr.open('post', requestURL('upload'), true);
        xhr.withCredentials = true;
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Accept', 'application/vnd.protonmail.v1+json');
        xhr.setRequestHeader('x-pm-appversion', 'Web_' + CONFIG.app_version);
        xhr.setRequestHeader('x-pm-apiversion', CONFIG.api_version);
        xhr.setRequestHeader('x-pm-session', pmcw.decode_base64(secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY + ':SessionToken') || ''));

        xhr.send(makeFormUpload(packets, message, tempPacket));

        return deferred.promise;
    };

    /**
     * Delete an attachment from the API
     * @param  {Message} message
     * @param  {Object} attachment
     * @return {Promise}
     */
    const remove = (message, attachment) => {
        return $http
            .delete(requestURL(attachment.ID), { MessageID: message.ID })
            .then(({ data = {} } = {}) => data)
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error || gettextCatalog.getString('Error during the remove request', null, 'Error delete attachment'));
            });
    };

    return { get, upload, killUpload, remove };
}
export default attachmentApi;
