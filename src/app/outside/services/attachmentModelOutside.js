angular.module('proton.outside')
    .factory('attachmentModelOutside', ($log, attachmentEoApi, AttachmentLoader, $rootScope, embedded, notify) => {

        const EVENT_NAME = 'attachment.upload.outside';
        const QUEUE = [];
        let MAP_ATTACHMENTS = {};
        const notifyError = (message) => notify({ message, classes: 'notification-danger' });

        const dispatch = (type, data) => $rootScope.$emit(EVENT_NAME, { type, data });

        /**
         * Dispatch an event for the sending button
         * @param  {Message} message
         */
        const dispatchMessageAction = (message) => $rootScope.$emit('actionMessage', message);

        $rootScope
            .$on(EVENT_NAME, (e, { type, data }) => {
                switch (type) {
                    case 'remove.all':
                        removeAll(data);
                        break;
                    case 'drop':
                        buildQueue(data);
                        break;
                    case 'upload':
                        convertQueue(data);
                        break;
                }
            });

        function buildQueue({ queue, message }) {
            QUEUE.push(queue);

            if (!queue.hasEmbedded) {
                dispatch('upload', {
                    message,
                    action: 'attachment'
                });
            }
        }

        const packetToAttachment = (list = []) => {
            return list.map((packet) => ({
                ID: `att_${Math.random().toString(32).slice(0, 12)}_${Date.now()}`,
                Name: packet.Filename,
                Size: packet.FileSize,
                Filename: packet.Filename,
                MIMEType: packet.MIMEType,
                KeyPackets: new Blob([packet.keys]),
                DataPacket: new Blob([packet.data])
            }));
        };

        function convertQueue({ message, action }) {
            const publicKey = message.publicKey;

            const files = QUEUE.reduce((acc, { files }) => acc.concat(files), []);

            if (action === 'attachment') {
                const promise = files.map(({ file }) => AttachmentLoader.load(file, publicKey));
                return Promise.all(promise)
                    .then(packetToAttachment)
                    .then((list) => (message.addAttachments(list), list))
                    .then(() => {
                        $rootScope.$emit('attachmentAdded');
                        dispatchMessageAction(message);
                        QUEUE.length = 0;
                    });
            }

            upload(files, message, action)
                .then(() => {
                    message.uploading = 0;
                    QUEUE.length = 0;
                });
        }

        /**
         * Remove an attachment based on it's configuration
         * It's coming from the composerAttachments component.
         * For new attchment it sends us a REQUEST_ID because it's a list of packets not attachments.
         * If you remove the embedded from the editor (SUPPR), you will have the attachment's ID,
         * and for a new one you need its REQUEST_ID (the front use packages).
         * @param  {Object} data
         * @return {void}
         */
        function remove(data) {
            const { id, message, packet, attachment } = data;
            const attConf = getConfigMapAttachment(id, attachment);
            const state = angular.extend({}, attConf || data, { message, attachment, id });

            if (packet.Inline === 1) {
                // Attachment removed, may remove embedded ref from the editor too
                dispatch('remove.embedded', state);
            }
            message.removeAttachment(attachment);
            dispatch('remove.success', state);
            cleanMap(state);
        }

        /**
         * Remove a list of attachments
         * @param  {Message} options.message
         * @param  {Array} options.list    List of attachments
         * @return {void}
         */
        function removeAll({ message, list }) {
            list
                .forEach((attachment) => {

                    remove({
                        id: attachment.ID,
                        attachment,
                        message,
                        packet: {
                            Inline: +isEmbedded(attachment)
                        }
                    });
                });
        }

        /**
         * Create a map [<REQUEST>] = <upload>
         * So we can have every informations for a request such as attachment etc.
         * Usefull for removing attachment as it can send us:
         *     - REQUEST_ID for new composer with new attachments
         *     - ATTACHEMENT_ID for a composer (ex:reply) with attachments
         * @param  {Array} uploads
         * @return {void}
         */
        const updateMapAttachments = (uploads = []) => {
            MAP_ATTACHMENTS = uploads
                .reduce((acc, att) => (acc[att.REQUEST_ID] = att, acc), MAP_ATTACHMENTS);
        };

        /**
         * Upload a list of attachments [...File]
         * @param  {Array}  queue   List of File
         * @param  {Object} message
         * @param  {String} action  attachment|inline (type of attachment) (default: attachment)
         * @param  {Boolean} triggerEvent Dispatch an event to refresh the view (default: true)
         * @param  {String} cid Content ID
         * @return {Promise}
         */
        function upload(queue = [], message = {}, action = 'attachment', triggerEvent = true, cid = '') {
            const promises = _.map(queue, ({ file, isEmbedded }, i, list) => {
                // required for BE to get a cid-header
                file.inline = +(isEmbedded && action === 'inline');
                return addAttachment(file, message, isEmbedded, list.length, cid);
            });

            message.uploading = promises.length;
            dispatchMessageAction(message);

            return Promise
                .all(promises)
                .then((upload) => upload.filter(Boolean)) // will be undefined for aborted request
                .then((upload) => {
                    message.uploading = 0;
                    dispatchMessageAction(message);

                    // Create embedded and replace theses files from the upload list
                    const embeddedMap = addEmbedded(upload, message);
                    return _.map(upload, (config) => {
                        return embeddedMap[config.attachment.ID] || config;
                    });
                })
                .then((upload) => {

                    message.addAttachments(upload.map(({ attachment }) => attachment));
                    updateMapAttachments(upload);

                    triggerEvent && dispatch('upload.success', { upload, message, messageID: message.ID });

                    return upload;
                })
                .catch(() => dispatchMessageAction(message));
        }

        /**
         * Check if an attachment is Embedded
         * @param  {Object}  options.Headers
         * @return {Boolean}
         */
        function isEmbedded({ Headers = {} }) {
            return Headers['content-disposition'] === 'inline';
        }

        /**
         * Filter a list of uploaded attachments to create embedded
         * @param {Array}  list    List of uploaded attachments
         * @param {Object} message
         * @return {Object}         Map[<attachmentID>] = config
         */
        function addEmbedded(list = [], message = {}) {
            return _.chain(list)
                .filter(({ attachment = {} }) => isEmbedded(attachment))
                .filter(({ cid }) => cid)
                .map(({ packets, attachment, sessionKey, cid, REQUEST_ID }) => {
                    const { url } = embedded.addEmbedded(message, cid, packets.Preview, attachment.MIMEType);
                    return { packets, sessionKey, attachment, cid, url, REQUEST_ID };
                })
                .reduce((acc, o) => (acc[o.attachment.ID] = o, acc), {})
                .value();
        }

        /**
         * Get a config for an attachment if available
         * It cames from its REQUEST_ID or if not we can try to find it
         * via its ATTACHMENT_ID.
         * If not it MUST return undefined
         * @param  {String} id         REQUEST_ID (can be ATTACHMENT_ID)
         * @param  {Object} attachment
         * @return {Object}            Undefined if no configuration is available
         */
        function getConfigMapAttachment(id, attachment) {
            if (MAP_ATTACHMENTS[id]) {
                return MAP_ATTACHMENTS[id];
            }

            return _.filter(MAP_ATTACHMENTS, (config) => config.attachment.ID === attachment.ID)[0];
        }

        function cleanMap({ REQUEST_ID }) {
            delete MAP_ATTACHMENTS[REQUEST_ID];
        }

        /**
         * Add a new attachment, upload it to the server
         * @param {File} file
         * @param {Message} message
         * @param {Boolean} insert Embedded or not
         * @param {Number} total Total of attachments
         * @param {String} cid Content ID
         */
        function addAttachment(file, message, insert = true, total = 1, cid = '') {
            const tempPacket = {
                filename: file.name,
                uploading: true,
                Size: file.size,
                ContentID: cid,
                Inline: file.inline || 0
            };

            // force update the embedded counter
            if (tempPacket.Inline) {
                message.NumEmbedded++;
            }

            message.attachmentsToggle = true;
            const publicKey = message.publicKey;

            return AttachmentLoader
                .load(file, publicKey)
                .then((packets) => {
                    return attachmentEoApi.upload(packets, message, tempPacket, total)
                        .then((attachment) => {
                            // Extract content-id even if there are no headers
                            const contentId = (attachment.Headers || {})['content-id'] || '';
                            const cid = contentId.replace(/[<>]+/g, '');
                            return { attachment, packets, cid };
                        })
                        .catch((err) => {
                            $log.error(err);
                            notifyError('Error during file upload');
                        });
                })
                .catch((err) => {
                    $log.error(err);
                    notifyError('Error encrypting attachment');
                    throw err;
                });
        }


        return { load: angular.noop };

    });
