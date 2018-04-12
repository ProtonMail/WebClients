import _ from 'lodash';
import { CONSTANTS } from '../../constants';

/* @ngInject */
function attachmentConverter(AttachmentLoader, invalidSignature) {
    // This prefix is really useful to distinguish 'real' attachments from pgp attachments.
    const ID_PREFIX = 'PGPAttachment';

    const getId = (message, parsedAttachment, number) =>
        `${ID_PREFIX}_${message.ID}_${parsedAttachment.checksum}_${number}`;
    /**
     * Unfortunately mailparser doesn't expose header data directly so we will reconstruct the headers
     * @param {String} generatedFileName The generatedFileName that mailparser either generated or parsed from the email
     * @param {String} contentDisposition
     * @param {String} contentId
     * @param {String} transferEncoding
     * @param {String} contentType
     * @returns array map of headers, keys are in lowercase
     */
    const getHeaders = ({
        generatedFileName = '',
        contentDisposition = '',
        contentId = '',
        transferEncoding = false,
        contentType = ''
    }) => {
        const headers = {};
        const filenameOption = '; filename=' + JSON.stringify(generatedFileName);
        headers['content-disposition'] = contentDisposition + filenameOption;
        // test if this is an assigned content id
        if (!/^.*@mailparser$/.test(contentId)) {
            headers['content-id'] = /^<.*>$/.test(contentId) ? contentId : `<${contentId}>`;
        }
        if (contentDisposition.toLowerCase() === 'inline') {
            headers.embedded = 1;
        }
        if (transferEncoding) {
            headers['content-transfer-encoding'] = transferEncoding;
        }
        headers['content-type'] = contentType + filenameOption;
        return headers;
    };

    /**
     * Convert a single attachment
     * @param {Object} message
     * @param {Object} parsedAttachment
     * @param {Number} number
     * @param {Number} verified
     * @returns {{ID, Headers: array, Name: *, KeyPackets: null, MIMEType: (string|*|string|string), Signature: null, Size, Encrypted: number}}
     */
    const convertSingle = (message, parsedAttachment, number, verified) => {
        const attachment = {
            ID: getId(message, parsedAttachment, number),
            Headers: getHeaders(parsedAttachment),
            Name: parsedAttachment.generatedFileName,
            KeyPackets: null, // already decrypted;
            MIMEType: parsedAttachment.contentType,
            Signature: null,
            Size: parsedAttachment.length,
            Encrypted: CONSTANTS.ENCRYPTED_STATUS.PGP_MIME
        };
        AttachmentLoader.put(attachment, parsedAttachment.content, verified);
        invalidSignature.askAgain(message, attachment, false);
        return attachment;
    };

    /**
     * Converts the parsedAttachment coming from mailparser to an attachment linked to the message provided.
     * @param {Object} message
     * @param {Array} parsedAttachments
     * @param {Number} verified
     * @returns {Array}
     */
    const convert = (message, parsedAttachments, verified) => {
        return _.map(parsedAttachments, (attachment, number) => convertSingle(message, attachment, number, verified));
    };

    return convert;
}
export default attachmentConverter;
