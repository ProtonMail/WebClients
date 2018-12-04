import _ from 'lodash';

import { flow, map, reduce, filter } from 'lodash/fp';
import { MIME_TYPES } from '../../constants';
import { uniqID } from '../../../helpers/string';

const { PLAINTEXT } = MIME_TYPES;

/* @ngInject */
function attachmentModelOutside(AttachmentLoader, dispatchers, embedded, notification) {
    const EVENT_NAME = 'attachment.upload.outside';

    const { on, dispatcher } = dispatchers([EVENT_NAME, 'actionMessage', 'attachmentAdded']);

    const QUEUE = [];
    const dispatch = (type, data) => dispatcher[EVENT_NAME](type, data);

    /**
     * Dispatch an event for the sending button
     * @param  {Message} message
     */
    const dispatchMessageAction = (message) => dispatcher.actionMessage('update', message);

    on(EVENT_NAME, (e, { type, data }) => {
        switch (type) {
            case 'remove.all':
                removeAll(data);
                break;
            case 'remove':
                remove(data);
                break;
            case 'drop':
                buildQueue(data);
                break;
            case 'upload':
                convertQueue(data);
                break;
        }
    });

    /**
     * Create a queue before encrypting each files
     * @param  {Object} options.queue   Queue config
     * @param  {Message} options.message
     * @return {void}
     */
    function buildQueue({ queue, message }) {
        QUEUE.push(queue);

        if (!queue.hasEmbedded) {
            dispatch('upload', { message, action: 'attachment' });
        }
    }

    /**
     * Build Headers for an attachment
     * @param  {String} options.Filename
     * @param  {Number} options.FileSize
     * @param  {Number} options.Inline
     * @param  {Message} message
     * @return {Object}
     */
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

    /**
     * Build a list of attachments from a packets (encrypted files) list coming
     * from AttachmentLoader
     * @param  {Message} message
     * @return {Function}          With one parameter, the list of packets
     */
    const packetToAttachment = (message) => (list = []) => {
        return list.map((packet) => ({
            ID: `att_${uniqID()}`,
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

    /**
     * Add attachments as embedded or attachment, we encrypt them. Triggered by the askAttachment message onDrop.
     * Actions
     *     - inline
     *     - attachment
     *     - cancel
     * @param  {Message} options.message
     * @param  {String} options.action  attachment||inline
     * @return {Promise}
     */
    function convertQueue({ message, action }) {
        const publicKey = message.publicKey;
        const files = QUEUE.reduce((acc, { files }) => acc.concat(files), []);

        if (action === 'cancel') {
            return (QUEUE.length = 0);
        }

        if (action === 'attachment') {
            const promise = files.map(({ file }) => AttachmentLoader.load(file, publicKey));
            return Promise.all(promise)
                .then(packetToAttachment(message))
                .then((list) => (message.addAttachments(list), list))
                .then(() => {
                    dispatcher.attachmentAdded();
                    dispatchMessageAction(message);
                    QUEUE.length = 0;
                });
        }

        uploadInline(files, message, action);
    }

    /**
     * Add embedded image to the attachments. Encrypt everything
     * @param  {Array} files   List of file to encrypt
     * @param  {Message} message
     * @return {Promise}
     */
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
                // Format them to match component's configuration
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
                console.error(err);
                notification.error('Error encrypting attachment');
                dispatchMessageAction(message);
            });
    }

    /**
     * Remove an attachment from a message
     *     - When you remove an attachment via BACK_KEY inside the editor,
     *     this remove is called via removeAll with the attchement as we have them
     *     - When you remove an attachment by clicking inside the list behind the reply you
     *     only have the ID
     * @param  {String} options.id         Id of the attachment
     * @param  {Message} options.message
     * @param  {Object} options.attachment Attachment (can be undefined)
     * @return {Void}
     */
    function remove({ id, message, attachment }) {
        const att = attachment || message.getAttachment(id);
        const state = { message, attachment: att, id };

        if (+isEmbedded(att) && message.MIMEType !== PLAINTEXT) {
            // Attachment removed, may remove embedded ref from the editor too
            dispatch('remove.embedded', state);
        }
        message.removeAttachment(attachment);
        dispatch('remove.success', state);
    }

    /**
     * Remove a list of attachments
     * @param  {Message} options.message
     * @param  {Array} options.list    List of attachments
     * @return {void}
     */
    function removeAll({ message, list }) {
        list.forEach((attachment) => {
            remove({
                id: attachment.ID,
                attachment,
                message
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
        return flow(
            filter((attachment = {}) => isEmbedded(attachment)),
            filter(({ Headers }) => Headers['content-id']),
            map((attachment) => {
                const { Headers, Preview, MIMEType } = attachment;
                const { url } = embedded.addEmbedded(message, Headers['content-id'], Preview, MIMEType);
                return angular.extend({}, attachment, { url });
            }),
            reduce((acc, att) => ((acc[att.ID] = att), acc), {})
        )(list);
    }

    /**
     * Encrypt every attachments for a message
     * @param  {Array}  options.Attachments
     * @param  {String} options.publicKey
     * @return {Promise}
     */
    function encrypt({ Attachments = [], publicKey }) {
        /**
         * A blob is ~ a File so we only need to bind two custom attributes
         * @param  {Blob} blob
         * @param  {String} name
         * @return {File}
         */
        const toFile = (blob, name) => {
            blob.inline = 1;
            blob.name = name;
            return blob;
        };

        const promises = Attachments.map((attachment) => {
            const cid = embedded.getCid(attachment.Headers);

            // ex signature else package is already encrypted
            if (cid && !attachment.DataPacket) {
                return embedded
                    .getBlob(cid)
                    .then((blob) => AttachmentLoader.load(toFile(blob, attachment.Name), publicKey))
                    .then((packet) => ({
                        CID: cid,
                        Filename: attachment.Name,
                        MIMEType: attachment.MIMEType,
                        Headers: attachment.Headers,
                        KeyPackets: new Blob([packet.keys]),
                        DataPacket: new Blob([packet.data])
                    }));
            }

            return Promise.resolve({
                CID: cid,
                Filename: attachment.Filename,
                DataPacket: attachment.DataPacket,
                MIMEType: attachment.MIMEType,
                KeyPackets: attachment.KeyPackets,
                Headers: attachment.Headers
            });
        });

        return Promise.all(promises);
    }

    return { load: angular.noop, encrypt };
}
export default attachmentModelOutside;
