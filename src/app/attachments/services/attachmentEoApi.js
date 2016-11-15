angular.module('proton.attachments')
    .factory('attachmentEoApi', ($http, url, $q, $rootScope, authentication, notify, pmcw, CONFIG, CONSTANTS, secureSessionStorage, gettextCatalog, $log) => {

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
        const makeFormUpload = (packets, message, tempPacket) => ({
            Filename: packets.Filename,
            MessageID: message.ID,
            ContentID: tempPacket.ContentID,
            MIMEType: packets.MIMEType,
            Inline: packets.Inline,
            KeyPackets: new Blob([packets.keys]),
            DataPacket: new Blob([packets.data])
        });

        function blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                try {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const [base64] = reader.result.split(',');
                        resolve(base64);
                    };
                    reader.readAsDataURL(blob);
                } catch (e) {
                    reject(e);
                }
            })
        }


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
        }

        /**
         * Get an attachment by its ID
         * @param  {String} ID
         * @return {Promise}
         */
        const get = (ID) => $http.get(`${url.get()}/attachments/${ID}`, { responseType: 'arraybuffer' });

        const upload = (packets, message, tempPacket, total) => {
            const attachment = {
                ID: "XXX!",
                Name: packets.Filename,
                Size: packets.FileSize,
                MIMEType: packets.MIMEType,
                KeyPackets: btoa(String.fromCharCode.apply(null, packets.keys)),
                Headers: {
                  'content-disposition': packets.Inline ? "inline" : "",
                  "content-id": "XXX"
                }
            }
            return Promise.resolve(attachment);
        };

        /**
         * Delete an attachment from the API
         * @param  {Message} message
         * @param  {Object} attachment
         * @return {Promise}
         */
        const remove = (message, attachment) => {
            return $http
                .delete(url.get() + '/attachments/' + attachment.ID, { MessageID: message.ID })
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
