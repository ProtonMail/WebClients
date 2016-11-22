angular.module('proton.outside')
    .factory('attachmentModelOutside', ($log, attachmentEoApi, AttachmentLoader, $rootScope, embedded, notify) => {

        const EVENT_NAME = 'attachment.upload.outside';
        const QUEUE = [];
        let MAP_ATTACHMENTS = {};
        const notifyError = (message) => notify({ message, classes: 'notification-danger' });

        const dispatch = (type, data) => $rootScope.$emit(EVENT_NAME, { type, data });

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
         * Dispatch an event for the sending button
         * @param  {Message} message
         */
        const dispatchMessageAction = (message) => $rootScope.$emit('actionMessage', message);

        $rootScope.$on(EVENT_NAME, (e, { type, data }) => {
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

        function buildHeaders({ Filename, FileSize, Inline }, message) {

            if (!Inline) {
                return {};
            }

            const cid = embedded.generateCid(`${Filename}${FileSize}`, message.SenderAddress);
            return {
                'content-disposition': 'inline',
                'content-id': cid
            };
        }

        const packetToAttachment = (message) => (list = []) => {
            return list.map((packet) => ({
                ID: `att_${Math.random().toString(32).slice(0, 12)}_${Date.now()}`,
                Name: packet.Filename,
                Size: packet.FileSize,
                Filename: packet.Filename,
                MIMEType: packet.MIMEType,
                KeyPackets: new Blob([packet.keys]),
                DataPacket: new Blob([packet.data]),
                Preview: packet.Preview,
                Headers: buildHeaders(packet, message)
            }));
        };

        function convertQueue({ message, action }) {
            const publicKey = message.publicKey;
            const files = QUEUE.reduce((acc, { files }) => acc.concat(files), []);

            if (action === 'attachment') {
                const promise = files.map(({ file }) => AttachmentLoader.load(file, publicKey));
                return Promise.all(promise)
                    .then(packetToAttachment(message))
                    .then((list) => (message.addAttachments(list), list))
                    .then(() => {
                        $rootScope.$emit('attachmentAdded');
                        dispatchMessageAction(message);
                        QUEUE.length = 0;
                    });
            }

            uploadInline(files, message, action);
        }

        function uploadInline(files, message) {
            const publicKey = message.publicKey;
            const promise = files.map(({ file, isEmbedded }) => {
                file.inline = +isEmbedded;
                return AttachmentLoader.load(file, publicKey);
            });

            message.uploading = promise.length;
            dispatchMessageAction(message);

            return Promise.all(promise)
                .then(packetToAttachment(message))
                .then((list) => (message.addAttachments(list), list))
                .then((list) => {
                    // Create embedded and replace theses files from the upload list
                    const embeddedMap = addEmbedded(list, message);
                    return _.map(list, (attachment) => {
                        return embeddedMap[attachment.ID] || attachment;
                    });
                })
                .then((list) => {
                    const upload = _.map(list, (attachment) => ({
                        attachment,
                        cid: (attachment.Headers || {})['content-id'] || '',
                        url: attachment.url || ''
                    }));
                    dispatch('upload.success', { upload, message, messageID: message.ID });
                })
                .then(() => {
                    message.uploading = 0;
                    dispatchMessageAction(message);
                    QUEUE.length = 0;
                })
                .catch((err) => {
                    $log.error(err);
                    notifyError('Error encrypting attachment');
                    dispatchMessageAction(message);
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
                .filter((attachment = {}) => isEmbedded(attachment))
                .filter(({ Headers }) => Headers['content-id'])
                .map((attachment) => {
                    const { Headers, Preview, MIMEType } = attachment;
                    const { url } = embedded.addEmbedded(message, Headers['content-id'], Preview, MIMEType);
                    return angular.extend({}, attachment, { url });
                })
                .reduce((acc, att) => (acc[att.ID] = att, acc), {})
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

        return { load: angular.noop };

    });
