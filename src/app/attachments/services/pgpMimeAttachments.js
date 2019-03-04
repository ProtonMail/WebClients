import { ENCRYPTED_STATUS } from '../../constants';

/* @ngInject */
function pgpMimeAttachments(AttachmentLoader, embeddedUtils, attachmentModel) {
    const isPGPAttachment = ({ Encrypted }) => Encrypted === ENCRYPTED_STATUS.PGP_MIME;

    const uploadAttachment = async (attachment, message, body) => {
        const data = await AttachmentLoader.get(attachment);

        const file = new Blob([data]);
        const cid = embeddedUtils.readCID(attachment.Headers);
        file.name = attachment.Name;

        if (cid) {
            file.inline = Number(embeddedUtils.isEmbedded(attachment, body));
        }

        return attachmentModel.create(file, message, file.inline === 1, cid);
    };

    /**
     * Uploads the list of pgp attachments as normal protonmail attachments which are stored as attachment object in the backend
     * This must be done because pgp/MIME attachments are actually stored in the body, and are thus unaccessable
     * For protonmail. But we need to upload them again to be able to send them using the protonmail api. They are
     * of course still encrypted, but now separately.
     * @param {Object} message
     * @param {Array} pgpAttachments A set of pgp attachments (which are not actually stored on the BE, but in the body)
     * @return {Promise}
     */
    const makeNative = (message, pgpAttachments = []) => {
        if (!pgpAttachments.length) {
            return;
        }
        const body = message.getDecryptedBody();
        const promises = pgpAttachments.map((attachment) => uploadAttachment(attachment, message, body));
        return Promise.all(promises);
    };

    /**
     * Upload message.pgpMimeAttachments if there exists any.
     * @param {MessageModel} message
     * @return {Promise}
     */
    const handle = async (message) => {
        await makeNative(message, message.pgpMimeAttachments);
        delete message.pgpMimeAttachments;
    };

    /**
     * Get pgp mime attachments from a list of attachments.
     * @param {Array} attachments
     * @return {Array}
     */
    const filter = (attachments = []) => attachments.filter(isPGPAttachment);

    /**
     * Remove pgp mime attachments from a list of attachments.
     * @param {Array} attachments
     * @return {Array}
     */
    const clean = (attachments = []) => attachments.filter((attachment) => !isPGPAttachment(attachment));

    return {
        handle,
        clean,
        filter
    };
}

export default pgpMimeAttachments;
