angular.module('proton.attachments')
    .factory('attachmentApi', ($http, url, $q, $rootScope, authentication, notify, pmcw, CONFIG, CONSTANTS, secureSessionStorage, gettextCatalog, $log) => {

        let pendingUpload = [];
        const notifyError = (message) => notify({ message, classes: 'notification-danger' });

        const dispatch = (type, data) => $rootScope.$emit('attachment.upload', { type, data });

        const dispatchUpload = (REQUEST_ID, { ID }, packet) => (progress, status) => {
            dispatch('uploading', {
                id: REQUEST_ID,
                messageID: ID,
                status, progress, packet
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
                return response({
                    Error: `JSON parsing error: ${xhr.responseText}`
                }, true);
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
            const upload = _.findWhere(pendingUpload, { id, messageID });
            upload.request.abort();
            pendingUpload = pendingUpload.filter((up) => up.id !== id);
            dispatch('cancel', { id, messageID });
        }

        /**
         * Get an attachment by its ID
         * @param  {String} ID
         * @return {Promise}
         */
        const get = (ID) => $http.get(`${url.get()}/attachments/${ID}`, { responseType: 'arraybuffer' });

        const upload = (packets, message, tempPacket, total) => {
            const REQUEST_ID = `${Math.random().toString(32).slice(2, 12)}-${Date.now()}`;
            const dispatcher = dispatchUpload(REQUEST_ID, message, tempPacket);
            const deferred = $q.defer();
            const xhr = new XMLHttpRequest();
            const keys = authentication.getPrivateKeys(message.AddressID);

            pendingUpload.push({
                id: REQUEST_ID,
                messageID: message.ID,
                packet: tempPacket,
                request: xhr
            });

            dispatcher(0, true);

            xhr.upload.onprogress = (event) => {
                const progress = (event.loaded / event.total) * 99;
                dispatcher(progress, true);
            };

            xhr.onload = function onload() {
                dispatcher(100, false);
                dispatch('uploaded.success', {
                    id: REQUEST_ID,
                    messageID: message.ID,
                    packet: tempPacket,
                    total
                });

                // remove the current request as it's resolved
                pendingUpload = _.reject(pendingUpload, {
                    id: REQUEST_ID,
                    messageID: message.ID
                });

                const { json, isInvalid } = parseJSON(xhr);

                const statusCode = this.status;

                if (statusCode !== 200) {
                    // Error with the request
                    notifyError(gettextCatalog.getString('Unable to upload file. Please try again', null, 'Error'));
                    return deferred.reject(json);
                }


                if (json.Error) {
                    // isInvalid = false: Attachment disallowed by back-end size limit (no change in size)
                    const msgError = !isInvalid ? json.Error : gettextCatalog.getString('Unable to upload file. Please try again', null, 'Error');

                    notifyError(msgError);
                    return deferred.reject(json);
                }

                pmcw
                    .decryptSessionKey(packets.keys, keys)
                    .then((sessionKey) => ({
                        REQUEST_ID,
                        sessionKey,
                        attachment: _.extend({}, json.Attachment || {}, { sessionKey })
                    }))
                    .then(deferred.resolve)
                    .catch(deferred.reject);
            };

            xhr.open('post', url.get() + '/attachments/upload', true);
            xhr.withCredentials = true;
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader('Accept', 'application/vnd.protonmail.v1+json');
            xhr.setRequestHeader('x-pm-appversion', 'Web_' + CONFIG.app_version);
            xhr.setRequestHeader('x-pm-apiversion', CONFIG.api_version);
            xhr.setRequestHeader('x-pm-session', pmcw.decode_base64(secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY + ':SessionToken')));

            xhr.send(makeFormUpload(packets, message, tempPacket));

            return deferred.promise;

        };

        /**
         * Delete an attachment from the API
         * @param  {Messag} message
         * @param  {Object} attachment
         * @return {Promise}
         */
        const remove = (message, { ID } = {}) => {
            return $http
                .put(url.get() + '/attachments/remove', {
                    MessageID: message.ID,
                    AttachmentID: ID
                })
                .then(({ data = {} }) => {
                    if (data.Code !== 1000) {
                        const error = data.Error || 'Error during the remove request';
                        throw new Error(error);
                    }
                    return data;
                })
                .catch((error) => {
                    notifyError(error);
                    $log.error(error);
                });
        };

        return { get, upload, killUpload, remove };
    });
