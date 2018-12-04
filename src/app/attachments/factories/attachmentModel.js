import _ from 'lodash';

import { flow, filter, map, reduce } from 'lodash/fp';

import { MIME_TYPES } from '../../constants';
import { readFileAsString } from '../../../helpers/fileHelper';

const { PLAINTEXT } = MIME_TYPES;

/* @ngInject */
function attachmentModel(
    attachmentApi,
    AttachmentLoader,
    dispatchers,
    embedded,
    keysModel,
    networkActivityTracker,
    composerRequestModel,
    attachmentDownloader,
    gettextCatalog,
    pmcw,
    SignatureVerifier
) {
    const MAX_KEY_SIZE = 50 * 1024;
    const queueMessage = {};
    let MAP_ATTACHMENTS = {};
    const EVENT_NAME = 'attachment.upload';
    const I18N = {
        IMAGE: gettextCatalog.getString('Image', null, 'Title')
    };

    const { on, dispatcher } = dispatchers([EVENT_NAME, 'actionMessage']);
    const dispatch = (type, data) => dispatcher[EVENT_NAME](type, data);

    /**
     * Dispatch an event for the sending button
     * @param  {Message} message
     */
    const dispatchMessageAction = (message) => dispatcher.actionMessage('update', message);

    /**
     * Create a map [<REQUEST>] = <upload>
     * So we can have every information for a request such as attachment etc.
     * Useful for removing attachment as it can send us:
     *     - REQUEST_ID for new composer with new attachments
     *     - ATTACHMENT_ID for a composer (ex:reply) with attachments
     * @param  {Array} uploads
     * @return {void}
     */
    const updateMapAttachments = (uploads = []) => {
        MAP_ATTACHMENTS = uploads.reduce((acc, att) => ((acc[att.REQUEST_ID] = att), acc), MAP_ATTACHMENTS);
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
        return _.find(message.Attachments, { ID: id });
    };

    on(EVENT_NAME, (e, { type, data }) => {
        switch (type) {
            case 'close':
                attachmentApi.killUpload(data);
                break;
            case 'uploading':
                data.message.encryptingAttachment = false;
                dispatchMessageAction(data.message);
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
            case 'download.composer':
                downloadFromComposer(data);
                break;
        }
    });

    const fillInMimeType = async (queueEntry) => {
        if (
            queueEntry.file.name.match(/\.asc$/i) &&
            queueEntry.file.size < MAX_KEY_SIZE &&
            queueEntry.file.type !== 'application/pgp-keys'
        ) {
            try {
                const data = await readFileAsString(queueEntry.file);
                // check if it's valid key data
                await pmcw.getKeys(data);
                // add new mimetype
                queueEntry.file = _.extend(new Blob([data], { type: 'application/pgp-keys' }), queueEntry.file);
            } catch (e) {
                // the attachment is not a valid key
            }
        }
    };

    /**
     * Create a queue of files for one message
     * if there is no embedded inside auto upload them
     * @param  {String} options.messageID
     * @param  {Message} options.message
     * @param  {Object} options.queue     List of files to upload
     * @return {void}
     */
    async function buildQueue({ messageID, message, queue }) {
        if (!queue.files.length) {
            return;
        }

        await Promise.all(queue.files.map(fillInMimeType));

        queueMessage[messageID] = queue;

        if (!queue.hasEmbedded) {
            dispatch('upload', {
                messageID,
                message,
                action: 'attachment'
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
            .then(([upload]) => ((message.uploading = 0), upload))
            .catch((err) => {
                console.error(err);
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
        upload(queue.files, message, action).then(() => {
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
        const promises = _.map(queue, ({ file, isEmbedded }, i, list) => {
            // required for BE to get a cid-header
            file.inline = +(isEmbedded && action === 'inline');
            return addAttachment(file, message, list.length, cid);
        });

        message.uploading = promises.length;
        message.encryptingAttachment = true;
        dispatchMessageAction(message);

        const promise = Promise.all(promises)
            .then((upload) => upload.filter(Boolean)) // will be undefined for aborted request
            .then((upload) => {
                message.uploading = 0;
                message.encryptingAttachment = false;
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

                if (triggerEvent && upload.length) {
                    dispatch('upload.success', { upload, message, messageID: message.ID });
                }
                return upload;
            })
            .catch((err) => {
                dispatchMessageAction(message);
                throw err;
            });

        composerRequestModel.save(message, promise);
        networkActivityTracker.track(promise);
        return promise;
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
            filter(({ attachment = {} }) => isEmbedded(attachment)),
            filter(({ cid }) => cid),
            map(({ packets, attachment, sessionKey, cid, REQUEST_ID }) => {
                const { url } = embedded.addEmbedded(message, cid, packets.Preview, attachment.MIMEType);
                return { packets, sessionKey, attachment, cid, url, REQUEST_ID };
            }),
            reduce((acc, o) => ((acc[o.attachment.ID] = o), acc), {})
        )(list);
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
     * For new attachment it sends us a REQUEST_ID because it's a list of packets not attachments.
     * If you remove the embedded from the editor (SUPPR), you will have the attachment's ID,
     * and for a new one you need its REQUEST_ID (the front use packages).
     * @param  {Object} data
     * @return {Promise}
     */
    function remove(data) {
        const { id, message, packet, messageID } = data;
        const msg = message || { ID: messageID };
        const attachment = data.attachment || getAttachment(msg, id);

        return attachmentApi
            .remove(msg, attachment)
            .then(() => {
                const attConf = getConfigMapAttachment(id, attachment);
                const state = _.extend({}, attConf || data, { message, attachment, id });

                if (packet.Inline === 1 && message.MIMEType !== PLAINTEXT) {
                    // Attachment removed, may remove embedded ref from the editor too
                    dispatch('remove.embedded', state);
                }

                message.removeAttachment(attachment);
                dispatch('remove.success', state);
                cleanMap(state);
            })
            .catch((exception) => {
                dispatch('remove.error', { message, exception, attachment, id });
            });
    }

    /**
     * Remove a list of attachments
     * @param  {Message} options.message
     * @param  {Array} options.list    List of attachments
     * @return {Array<Promise>}
     */
    function removeAll({ message, list }) {
        return list.map((attachment) =>
            remove({
                id: attachment.ID,
                attachment,
                message,
                packet: {
                    Inline: +isEmbedded(attachment)
                }
            })
        );
    }

    /**
     * Sign an attachment: it sends the signature to the BE and sets the signature field. Also it stored
     * in our signature cache, so one can use SignatureVerifier.get.
     * @param {Object} attachment
     * @param {Object} message
     * @returns {Promise.<*>}
     */
    async function sign(attachment, message) {
        // async because we need to use data twice :-)
        const privateKeys = keysModel.getPrivateKeys(message.AddressID);

        const data = await AttachmentLoader.get(attachment, message);
        const { signature } = await pmcw.signMessage({ data, privateKeys, armor: true, detached: true });
        attachment.Signature = signature;
        await attachmentApi.updateSignature(attachment);
        /*
             ensure that we store the attachment as correctly signed it the signature store (needed to keep the
             show the symbols in the attachments after sending the message, as the attachments will be inside the cache)
             Otherwise you will send the message and the send message doesn't show the attachments as correctly signed.
            */
        await SignatureVerifier.verify(attachment, data, message);

        return attachment;
    }

    /**
     * Add a new attachment, upload it to the server
     * @param {File} file
     * @param {Object} message
     * @param {Number} total Total of attachments
     * @param {String} cid Content ID
     */
    function addAttachment(file, message, total = 1, cid = '') {
        const tempPacket = {
            filename: file.name || `${I18N.IMAGE} ${message.Attachments.length + 1}`,
            uploading: true,
            Size: file.size,
            ContentID: cid
        };

        // force update the embedded counter
        if (file.inline) {
            message.NumEmbedded++;
            // CID doesn't exist when the user add an attachment
            tempPacket.ContentID = cid || embedded.generateCid(file.upload.uuid, message.From.Email);
            tempPacket.Inline = 1;
        }

        const privateKeys = keysModel.getPrivateKeys(message.AddressID);
        message.attachmentsToggle = true;

        const doUpload = (packets) => {
            return attachmentApi
                .upload(packets, message, tempPacket, total)
                .then(({ attachment, sessionKey, REQUEST_ID, isAborted }) => {
                    if (isAborted) {
                        return;
                    }

                    // Extract content-id even if there are no headers
                    const contentId = `${(attachment.Headers || {})['content-id'] || ''}`;
                    const cid = contentId.replace(/[<>]+/g, '');

                    return { attachment, sessionKey, packets, cid, REQUEST_ID };
                });
        };

        return AttachmentLoader.load(file, message.From.Keys[0].PublicKey, privateKeys).then(doUpload);
    }

    const getCurrentQueue = ({ ID }) => queueMessage[ID];

    /**
     * Download an attachment from the composer
     * As we don't know the current attachment we need to get it from the model itself
     *     ->> We MUST not know the attachment inside the composer
     * @param  {String} options.id      Packet id
     * @param  {Message} options.message
     * @return {void}
     */
    function downloadFromComposer({ id, message }) {
        const config = MAP_ATTACHMENTS[id] || { attachment: message.getAttachment(id) };
        if (config.attachment) {
            attachmentDownloader.download(config.attachment, message);
        }
    }

    return { create, getCurrentQueue, sign };
}
export default attachmentModel;
