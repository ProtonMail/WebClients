import _ from 'lodash';
import mimemessage from 'mimemessage';

/* @ngInject */
function mimeMessageBuilder(pmcw, embeddedUtils, AttachmentLoader) {
    /**
     * Remove '; name=' and '; filename=' values
     * @param {String} value
     */
    const extractContentValue = (value = '') => {
        const semicolonIndex = value.indexOf(';');

        if (semicolonIndex === -1) {
            return value;
        }

        return value.substr(0, semicolonIndex);
    };

    const buildAttachments = (attachments) => {
        return _.map(attachments, ({ attachment, data }) => {
            const attachmentName = JSON.stringify(attachment.Name);
            const contentTypeValue =
                extractContentValue(attachment.Headers['content-type']) ||
                attachment.MIMEType ||
                'application/octet-stream';
            const contentDispositionValue =
                extractContentValue(attachment.Headers['content-disposition']) || 'attachment';
            const entity = mimemessage.factory({
                contentType: `${contentTypeValue}; filename=${attachmentName}; name=${attachmentName}`,
                contentTransferEncoding: 'base64',
                body: pmcw.arrayToBinaryString(data)
            });

            entity.header(
                'content-disposition',
                `${contentDispositionValue}; filename=${attachmentName}; name=${attachmentName}`
            );

            if (attachment.Headers['content-id']) {
                entity.header('content-id', attachment.Headers['content-id']);
            }

            return entity;
        });
    };

    const buildEmbeddedHtml = (html, attachments) => {
        const htmlEntity = mimemessage.factory({
            contentType: 'text/html;charset=utf-8',
            contentTransferEncoding: 'base64',
            body: html
        });

        const testDiv = embeddedUtils.getBodyParser(html);
        const inlineAttachments = embeddedUtils.extractEmbedded(attachments, testDiv);
        const attachmentEntities = buildAttachments(inlineAttachments);

        // add the attachments
        const relatedBody = [htmlEntity].concat(attachmentEntities);

        return mimemessage.factory({
            contentType: 'multipart/related',
            body: relatedBody
        });
    };

    // quoted printable for compatibility with old clients
    const buildPlaintextEntity = (plaintext) => {
        // mimemessagefactory doesn't handle the empty string well.
        return mimemessage.factory({
            body: plaintext,
            contentTransferEncoding: 'quoted-printable'
        });
    };

    const buildAlternateEntity = (plaintext, html, attachments) => {
        // Build the multipart/alternate MIME entity containing both the HTML and plain text entities.
        return mimemessage.factory({
            contentType: 'multipart/alternative',
            body: [buildPlaintextEntity(plaintext), buildEmbeddedHtml(html, attachments)]
        });
    };

    /**
     * Builds a mime body given the plaintext, html source and a list of attachments to fetch embedded images from
     * @param {String|false} plaintext The plaintext string or false if the generated body should not have a plaintext part
     * @param {String|false} html The HTML string or false if the generated body should not have a plaintext part
     * @param {Array} attachments A list of attachments from which we can fetch the embedded images.
     * @return {mimemessage.entity}
     */
    const buildBodyEntity = (plaintext, html, attachments) => {
        if (html !== false && plaintext !== false) {
            return buildAlternateEntity(plaintext, html, attachments);
        }
        return html !== false ? buildEmbeddedHtml(html, attachments) : buildPlaintextEntity(plaintext);
    };

    /**
     * Extracts the non-inline attachments from the given html.
     * @param html
     * @param attachments
     * @return {Array<Attachment>} Array of attachments
     */
    const getNormalAttachments = (html, attachments) => {
        if (html === false) {
            return attachments;
        }
        const testDiv = embeddedUtils.getBodyParser(html);
        const embeddedAttachments = embeddedUtils.extractEmbedded(attachments, testDiv);
        return _.difference(attachments, embeddedAttachments);
    };

    /**
     * Builds a multipart message from the given plaintext, html bodies and attachments.
     * The html body is not necessary to create a valid mime body
     * @param {String|false} plaintext if the body should not contain plaintext should be false
     * @param {String|false} html if the body should not contain html should be false
     * @param {Array} attachments
     * @returns {String}
     */
    const build = (plaintext, html, attachments) => {
        const bodyEntity = buildBodyEntity(plaintext, html, attachments);
        const normalAttachments = getNormalAttachments(html, attachments);
        const attachmentEntities = buildAttachments(normalAttachments);
        const body = [bodyEntity].concat(attachmentEntities);

        const msgentity = mimemessage.factory({
            contentType: 'multipart/mixed',
            body
        });
        // this trailing line space is important: if it's not there outlook.com adds it and breaks pgp/mime signatures.
        return msgentity.toString() + '\r\n';
    };

    /**
     * Generates/Gets the plaintext body from the message. If the message is not composed in plaintext, it will downconvert
     * the html body to plaintext if downconvert is set. If downconvert is disabled it will return false.
     * @param {Object} message
     * @param {Boolean} downconvert
     * @return {String}
     */
    const generatePlaintext = (message, downconvert) => {
        if (!message.isPlainText() && !downconvert) {
            return false;
        }
        return message.exportPlainText();
    };

    const fetchMimeDependencies = (message, downconvert) =>
        Promise.all(
            _.map(message.getAttachments(), async (attachment) => ({
                attachment,
                data: await AttachmentLoader.get(attachment, message)
            }))
        ).then((attachments) => [attachments, generatePlaintext(message, downconvert)]);

    const construct = async (message, downconvert = true) => {
        if (message.isMIME() && message.decryptedMIME) {
            return message.decryptedMIME;
        }
        const [attachments, plaintext] = await fetchMimeDependencies(message, downconvert);
        const html = message.MIMEType === 'text/html' ? message.getDecryptedBody() : false;

        return build(plaintext, html, attachments);
    };

    return { construct, build };
}
export default mimeMessageBuilder;
