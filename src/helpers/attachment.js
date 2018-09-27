/* eslint-disable import/prefer-default-export */
const ENCRYPTION_SIZE_SLACK = 0.2;

/**
 * Checks if the given blob equals the attachment that is already uploaded.
 * Size matching is done with some slack to take into account the difference between plaintext and encryption.
 *
 * @param {String} name The filename of the blob
 * @param {String} type The mimetype of the blob
 * @param {Integer} size The size of the blob
 * @param {String} Name The filename of the Attachment
 * @param {String} MIMEType The mimetype of the attachment
 * @param {Integer} Size The size of the attachment.
 * @return {boolean}
 */
export const blobEqualsAttachment = ({ name, type, size }, { Name, MIMEType, Size }) => {
    // The size can differ because the attachment is already encrypted
    return (
        Name === name &&
        MIMEType === type &&
        size > (1 - ENCRYPTION_SIZE_SLACK) * Size &&
        size < (1 + ENCRYPTION_SIZE_SLACK) * Size
    );
};
