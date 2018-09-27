import { blobEqualsAttachment } from '../../../helpers/attachment';

/* @ngInject */
function attachPublicKey(authentication, attachmentModel, dispatchers, pmcw) {
    const { dispatcher } = dispatchers(['attachment.upload']);
    /**
     * Generate a blob corresponding to the public key that is passed in. The name is extracted from the message the
     * key will be attached to.
     *
     * @param {Message} message
     * @param {String} publicKeyArmored
     * @param {String} fingerprint
     * @return {Blob}
     */
    const fileFromKeyInfo = (message, { publicKeyArmored, fingerprint } = {}) => {
        const file = new Blob([publicKeyArmored], { type: 'application/pgp-keys' });
        file.name = `publickey - ${message.From.Email} - 0x${fingerprint.slice(0, 8).toUpperCase()}.asc`;
        file.inline = 0;
        return file;
    };

    /**
     * Attaches the senders public key if primaryKeyAttached has been set. Should be called whenever the message is going to be sent.
     *
     * @param {Message} message
     * @return {Promise<void>}
     */
    const attachPublicKey = async (message = {}) => {
        if (!message.primaryKeyAttached) {
            return;
        }

        const privateKeys = authentication.getPrivateKeys(message.From.ID)[0];
        const info = await pmcw.keyInfo(privateKeys.armor());
        const file = fileFromKeyInfo(message, info);
        const attachmentExists = message.Attachments.some((attachment) => blobEqualsAttachment(file, attachment));

        if (attachmentExists) {
            return;
        }

        const { attachment } = await attachmentModel.create(file, message, false);
        // Added so we can remove the attachment easily if sending fails.
        attachment.isPublicKey = true;
    };

    /**
     * Remove the public key from the message. Should be triggered if message sending failed.
     *
     * @param {Message} message
     * @return {Promise<void>}
     */
    const removePublicKey = async (message) => {
        const list = message.Attachments.filter(({ isPublicKey = false }) => isPublicKey);
        dispatcher['attachment.upload']('remove.all', { message, list });
    };

    return { attach: attachPublicKey, remove: removePublicKey };
}
export default attachPublicKey;
