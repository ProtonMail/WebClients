angular.module('proton.outside')
    .factory('attachmentModelOutside', ($log, $q, attachmentApi, AttachmentLoader, $rootScope, embedded, notify, networkActivityTracker, squireExecAction) => {

        const EVENT_NAME = 'attachment.upload.outside';
        const QUEUE = [];
        const MAP_ATTACHMENTS = {};

        const notifyError = (message) => notify({ message, classes: 'notification-danger' });

        const dispatch = (type, data) => $rootScope.$emit(EVENT_NAME, { type, data });

        /**
         * Dispatch an event for the sending button
         * @param  {Message} message
         */
        const dispatchMessageAction = (message) => $rootScope.$emit('actionMessage', message);

        $rootScope
            .$on(EVENT_NAME, (e, { type, data }) => {

                console.trace(type, data)

                switch (type) {
                    // case 'close':
                    //     attachmentApi.killUpload(data);
                    //     break;
                    // case 'cancel':
                    //     dispatchMessageAction(data.message);
                    //     break;
                    // case 'remove':
                    //     remove(data);
                    //     break;
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

            const { promise, map } = QUEUE.reduce((acc, { files }) => acc.concat(files), [])
                .reduce((acc, cfg) => {
                    acc.promise.push(AttachmentLoader.load(cfg.file, publicKey));
                    acc.map[cfg.file.name] = cfg;
                    return acc;
                }, { promise: [], map: {} });

            Promise.all(promise)
                .then(packetToAttachment)
                .then((list) => (message.addAttachments(list), list))
                .then((attachments) => {
                    $rootScope.$emit('attachmentAdded');
                    dispatchMessageAction(message);
                    return attachments;
                })
                .then((attachments) => {
                    attachments.forEach((att) => {
                        const config = map[att.Name] || {};
                        if (config.isEmbedded) {
                            const file = config.file;
                            file.ID = att.ID;
                            squireExecAction.insertImage(message, '', file);
                        }
                    });
                })
                .then(() => {
                    message.Attachments.forEach((att) => {
                        const config = map[att.Name] || {};
                        MAP_ATTACHMENTS[att.ID] = {
                            file: config.file || att,
                            isEmbedded: !!config.isEmbedded
                        };
                    });
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
            // const attachment = data.attachment || getAttachment(message, id);

            // attachmentApi.remove(message, attachment)
            //     .then(() => {

            //         const attConf = getConfigMapAttachment(id, attachment);
            //         const state = angular.extend({}, attConf || data, { message, attachment, id });

                    if (packet.Inline === 1) {
                        // Attachment removed, may remove embedded ref from the editor too
                        dispatch('remove.embedded', data)
                    }
                    message.removeAttachment(attachment);
                    dispatch('remove.success', data);
                //     cleanMap(state);
                // });
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
                            Inline: +MAP_ATTACHMENTS[attachment.ID].isEmbedded
                        }
                    });
                });
        }


        return { load: angular.noop };

    });
