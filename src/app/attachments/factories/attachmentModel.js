angular.module('proton.attachments')
    .factory('attachmentModel', ($log, $q, attachmentApi, AttachmentLoader, $rootScope, embedded, notify, networkActivityTracker, composerRequestModel) => {

        const queueMessage = {};
        let MAP_ATTACHMENTS = {};
        const notifyError = (message) => notify({ message, classes: 'notification-danger' });

        /**
         * Dispatch an event for the sending button
         * @param  {Message} message
         */
        const dispatchMessageAction = (message) => $rootScope.$emit('actionMessage', message);

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
         * Get an attachment for a message by its ID
         *     => IT CAN BE A REQUEST_ID cf composerAttachment component
         * @param  {Message} message
         * @param  {String} id      REQUEST_ID || AttachmentID
         * @return {Object}         Attachment
         */
        const getAttachment = (message, id) => {
            // This is a requestID
            if (MAP_ATTACHMENTS[id]) {
                return MAP_ATTACHMENTS[id].attachment;
            }
            return _.findWhere(message.Attachments, { ID: id });
        };

        $rootScope
            .$on('attachment.upload', (e, { type, data }) => {
                switch (type) {
                    case 'close':
                        attachmentApi.killUpload(data);
                        break;
                    case 'cancel':
                        dispatchMessageAction(data.message);
                        break;
                    case 'remove':
                        remove(data);
                        break;
                    case 'remove.all':
                        removeAll(data);
                        break;
                    case 'drop':
                        buildQueue(data);
                        break;
                    case 'upload':
                        uploadQueue(data);
                        break;
                }
            });

        /**
         * Create a queue of files for one message
         * if there is no embedded inside auto upload them
         * @param  {String} options.messageID
         * @param  {Message} options.message
         * @param  {Object} options.queue     List of files to upload
         * @return {void}
         */
        function buildQueue({ messageID, message, queue }) {
            queueMessage[messageID] = queue;

            if (!queue.hasEmbedded) {
                $rootScope.$emit('attachment.upload', {
                    type: 'upload',
                    data: {
                        messageID, message,
                        action: 'attachment'
                    }
                });
            }
        }

        /**
         * Convert any file as attachment and upload it
         * @param  {File} file
         * @param  {Object} message
         * @param  {Boolean} inset  Append to the message
         * @param  {String} cid  Content ID
         * @return {Promise} With the configuration for this attachment
         */
        function create(file, message, insert = true, cid = '') {
            const action = insert && 'inline';
            return upload([{ file, isEmbedded: insert }], message, action, false, cid)
                .then(([ upload ]) => (message.uploading = 0, upload))
                .catch((err) => {
                    $log.error(err);
                    throw err;
                });
        }

        /**
         * When the user want to perform an action with the queue
         *     - cancel => forget it I don't want to upload them, sorry
         *     - inline => Embedded
         *     - attachment => ex zip etc.
         * @param  {String} options.messageID
         * @param  {Message} options.message
         * @param  {String} options.action
         * @return {void}
         */
        function uploadQueue({ messageID, message, action }) {

            if (action === 'cancel') {
                delete queueMessage[messageID];
                return;
            }

            const queue = queueMessage[messageID];
            upload(queue.files, message, action)
                .then(() => {
                    message.uploading = 0;
                    delete queueMessage[messageID];
                });
        }

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
            const deferred = $q.defer();
            const promises = _.map(queue, ({ file, isEmbedded }, i, list) => {
                // required for BE to get a cid-header
                file.inline = +(isEmbedded && action === 'inline');
                return addAttachment(file, message, isEmbedded, list.length, cid);
            });

            message.uploading = promises.length;
            dispatchMessageAction(message);

            composerRequestModel.save(message, deferred);
            networkActivityTracker.track(deferred.promise);

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

                    triggerEvent && $rootScope.$emit('attachment.upload', {
                        type: 'upload.success',
                        data: { upload, message, messageID: message.ID }
                    });

                    deferred.resolve();
                    return upload;
                })
                .catch((err) => {
                    dispatchMessageAction(message);
                    deferred.reject(err);
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
         * Remove an attachment based on it's configuration
         * It's coming from the composerAttachments component.
         * For new attchment it sends us a REQUEST_ID because it's a list of packets not attachments.
         * If you remove the embedded from the editor (SUPPR), you will have the attachment's ID,
         * and for a new one you need its REQUEST_ID (the front use packages).
         * @param  {Object} data
         * @return {void}
         */
        function remove(data) {
            const { id, message, packet } = data;
            const attachment = data.attachment || getAttachment(message, id);

            attachmentApi.remove(message, attachment)
                .then(() => {

                    const attConf = getConfigMapAttachment(id, attachment);
                    const state = angular.extend({}, attConf || data, { message, attachment, id });

                    if (packet.Inline === 1) {
                        // Attachment removed, may remove embedded ref from the editor too
                        $rootScope.$emit('attachment.upload', { type: 'remove.embedded', data: state });
                    }
                    message.removeAttachment(attachment);
                    $rootScope.$emit('attachment.upload', { type: 'remove.success', data: state });
                    cleanMap(state);
                });
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

            return AttachmentLoader
                .load(file, message.From.Keys[0].PublicKey)
                .then((packets) => {
                    return attachmentApi.upload(packets, message, tempPacket, total)
                        .then(({ attachment, sessionKey, REQUEST_ID, isAborted }) => {

                            if (isAborted) {
                                return;
                            }

                            // Extract content-id even if there are no headers
                            const contentId = (attachment.Headers || {})['content-id'] || '';
                            const cid = contentId.replace(/[<>]+/g, '');
                            return { attachment, sessionKey, packets, cid, REQUEST_ID };
                        })
                        .catch((err) => {
                            $log.error(err);
                            notifyError('Error during file upload');
                            throw err;
                        });
                })
                .catch((err) => {
                    $log.error(err);
                    notifyError('Error encrypting attachment');
                    throw err;
                });
        }

        /**
         * Download an attachment
         * @param  {Object} attachment
         * @param  {Message} message
         * @param  {Node} href
         * @return {Promise}
         */
        const download = (attachment, message, href) => {
            return AttachmentLoader
                .get(attachment, message)
                .then((buffer) => ({
                    data: buffer,
                    Name: attachment.Name,
                    MIMEType: attachment.MIMEType,
                    el: href
                }))
                .then(AttachmentLoader.generateDownload);
        };


        return { create, download };

    });
