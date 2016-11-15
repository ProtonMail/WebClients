angular.module('proton.outside')
    .factory('attachmentModelOutside', ($log, $q, attachmentApi, AttachmentLoader, $rootScope, embedded, notify, networkActivityTracker, squireExecAction) => {

        const EVENT_NAME = 'attachment.upload.outside';
        const QUEUE = [];

        const notifyError = (message) => notify({ message, classes: 'notification-danger' });

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
                    // case 'remove.all':
                    //     removeAll(data);
                    //     break;
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
                $rootScope.$emit(EVENT_NAME, {
                    type: 'upload',
                    data: {
                        message,
                        action: 'attachment'
                    }
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
            const list = QUEUE.reduce((acc, { files }) => acc.concat(files), []);
            const promise = list.map(({ file }) => AttachmentLoader.load(file, publicKey));

            list.forEach(({ file, isEmbedded }) => {
                isEmbedded && squireExecAction.insertImage(message, '', file);
            });

                Promise.all(promise)
                    .then(packetToAttachment)
                    .then((attachments) => {
                        message.addAttachments(attachments);
                        $rootScope.$emit('attachmentAdded');
                        dispatchMessageAction(message);
                        QUEUE.length = 0;
                        console.log(attachments);
                    });


        }




        return { load: angular.noop };

    });
