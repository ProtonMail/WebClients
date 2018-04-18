import { OAUTH_KEY } from '../../constants';

/* @ngInject */
function attachmentApi(
    $http,
    url,
    $q,
    dispatchers,
    authentication,
    pmcw,
    CONFIG,
    secureSessionStorage,
    gettextCatalog
) {
    const MAP = {
        message: {},
        request: {}
    };

    const requestURL = url.build('attachments');
    const { dispatcher } = dispatchers(['attachment.upload']);
    const dispatch = (type, data) => dispatcher['attachment.upload'](type, data);
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
        if (packets.signature) {
            data.append('Signature', new Blob([packets.signature]));
        }
        return data;
    };

    /**
     * Close a pending request and dispatch an action
     * @param  {Numer} options.id        Timestamp id for a request
     * @param  {String} options.messageID
     * @return {void}
     */
    function killUpload({ id, messageID }) {
        MAP.request[id].request.abort();
        delete MAP.message[messageID][id];
        delete MAP.request[id];
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
        const { on, unsubscribe } = dispatchers();

        // Check the network status of the app (XHR does not auto close)
        on('AppModel', (e, { type, data = {} }) => {
            if (type === 'onLine' && !data.value) {
                xhr.abort();
            }
        });

        const pending = {
            id: REQUEST_ID,
            messageID: message.ID,
            packet: tempPacket,
            request: xhr
        };

        MAP.message[message.ID] = {
            ...(MAP.message[message.ID] || {}),
            [REQUEST_ID]: pending
        };

        MAP.request[REQUEST_ID] = MAP.message[message.ID][REQUEST_ID];

        dispatcher(1, true, true);

        xhr.upload.onprogress = (event) => {
            const progress = event.loaded / event.total * 99;
            dispatcher(progress, true);
        };

        xhr.onerror = onerror;

        function onerror(json) {
            // remove the current request as it's resolved
            delete MAP.message[message.ID][REQUEST_ID];
            delete MAP.request[REQUEST_ID];

            message.uploading = Object.keys(MAP.message[message.ID]).length;

            dispatch('error', {
                id: REQUEST_ID,
                messageID: message.ID,
                message
            });

            if (json) {
                return deferred.reject(json);
            }

            deferred.resolve({ id: REQUEST_ID, isError: true });
            unsubscribe();
        }

        xhr.onabort = function onabort() {
            // remove the current request as it's resolved
            delete MAP.message[message.ID][REQUEST_ID];
            delete MAP.request[REQUEST_ID];

            message.uploading = Object.keys(MAP.message[message.ID]).length;

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

            if (statusCode !== 200 || json.Error) {
                // isInvalid = false: Attachment disallowed by back-end size limit (no change in size)
                const msgError = !isInvalid
                    ? json.Error
                    : gettextCatalog.getString('Unable to upload file. Please try again', null, 'Error');
                return onerror({
                    ...json,
                    Error: msgError
                });
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
            delete MAP.message[message.ID][REQUEST_ID];
            delete MAP.request[REQUEST_ID];

            const msg = pmcw.getMessage(packets.keys);

            pmcw
                .decryptSessionKey({ message: msg, privateKeys: keys })
                .then((sessionKey) => ({
                    REQUEST_ID,
                    sessionKey,
                    attachment: {
                        ...(json.Attachment || {}),
                        sessionKey
                    }
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
        xhr.setRequestHeader('x-pm-uid', secureSessionStorage.getItem(OAUTH_KEY + ':UID'));

        xhr.send(makeFormUpload(packets, message, tempPacket));

        return deferred.promise;
    };

    /**
     * Delete an attachment from the API
     * @param  {Message} message
     * @param  {Object} attachment
     * @return {Promise}
     */
    const remove = async ({ ID: MessageID } = {}, attachment = {}) => {
        try {
            const { data = {} } = await $http.delete(requestURL(attachment.ID), { MessageID });
            return data;
        } catch (e) {
            const error = gettextCatalog.getString('Error during the remove request', null, 'Error delete attachment');
            throw new Error(e.Error || error);
        }
    };

    const updateSignature = ({ ID, Signature }) => $http.put(requestURL(ID, 'signature'), { Signature });

    return { get, upload, updateSignature, killUpload, remove };
}
export default attachmentApi;
