import _ from 'lodash';
import mimemessage from 'mimemessage';

/* @ngInject */
function mimeMessageBuilder(pmcw, embeddedUtils, AttachmentLoader) {
    const RFC2045_LIMIT = 76;

    const arrayToBase64 = _.flowRight(
        pmcw.encode_base64,
        pmcw.arrayToBinaryString
    );
    const wrapline = (line, escape = '', limit = RFC2045_LIMIT) => {
        const lineCount = Math.ceil(line.length / limit);
        const result = Array.from({ length: lineCount }, (_, i) => line.substring(limit * i, limit * (i + 1)));
        return result.join(escape + '\r\n');
    };
    // the newlines in mime messages are \r\n. This function expects \n as incoming lines and produces \r\n newlines.
    const wraplines = (lines, escape = '', limit = RFC2045_LIMIT) =>
        lines
            .split('\n')
            .map((line) => wrapline(line, escape, limit))
            .join('\r\n');

    const random16bitHex = () =>
        Math.floor(Math.random() * (2 << 15))
            .toString(16)
            .padStart(4, 0);
    const random128bitHex = () =>
        new Array(8)
            .fill(null)
            .map(random16bitHex)
            .join('');
    // Needed because the default library produces really short boundaries + we want to match the structure with the BE
    const generateBoundary = () => `---------------------${random128bitHex()}`;

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
            const entity = mimemessage.factory({
                contentType: `${attachment.MIMEType}; name=${attachmentName}`,
                contentTransferEncoding: 'base64',
                body: wraplines(arrayToBase64(data))
            });

            const headers = {
                'content-type': extractContentValue(attachment.Headers['content-type']),
                'content-disposition': extractContentValue(attachment.Headers['content-disposition']) || 'attachment'
            };

            _.each(headers, (value, key) => {
                if (key === 'content-type' || key === 'content-disposition') {
                    return entity.header(key, `${value}; filename=${attachmentName}; name=${attachmentName}`);
                }

                entity.header(key, value);
            });

            return entity;
        });
    };

    const buildEmbeddedHtml = (html, attachments) => {
        const htmlEntity = mimemessage.factory({
            contentType: 'text/html;charset=utf-8',
            contentTransferEncoding: 'base64',
            body: wraplines(pmcw.encode_utf8_base64(html || ' '))
        });

        const inlineAttachments = _.filter(attachments, ({ attachment: { Headers } }) =>
            embeddedUtils.isInline(Headers)
        );
        const attachmentEntities = buildAttachments(inlineAttachments);

        // add the attachments
        const relatedBody = [htmlEntity].concat(attachmentEntities);

        return mimemessage.factory({
            contentType: `multipart/related; boundary="${generateBoundary()}"`,
            body: relatedBody
        });
    };

    // Don't escape newlines, tabs, everything between space and ~ save the = sign.
    const MATCH_ESCAPE_CHARS = /[^\t\n\r\x20-\x3C\x3E-\x7E]/g;
    const encodeQPSequence = (char) =>
        '=' +
        (
            '00' +
            char
                .charCodeAt(0)
                .toString(16)
                .toUpperCase()
        ).substr(-2);
    const encodeQPSequences = (input) => input.replace(MATCH_ESCAPE_CHARS, encodeQPSequence);
    const normalLinebreaks = (input) => input.replace(/(\r\n|\n|\r)/g, '\n');
    // restore wrapping in escape sequences ==\r\n0D, =0\r\nD -> =0D=\r\n
    const restoreQPSequences = (input) =>
        input.replace(
            /(?=.{0,2}=\r\n)(=(=\r\n)?[0-9A-F](=\r\n)?[0-9A-F])/g,
            (seq) => seq.replace(/=\r\n/, '') + '=\r\n'
        );
    const wrapQPLines = (input) => restoreQPSequences(wraplines(input, '=', RFC2045_LIMIT - 2));
    const encodeQPTrailingSpace = (input) => input.replace(/ $/gm, ' =\r\n\r\n');
    /**
     * Quoted-Printable, or QP encoding, is an encoding using printable ASCII characters
     * (alphanumeric and the equals sign =) to transmit 8-bit data over a 7-bit data path)
     * Any 8-bit byte value may be encoded with 3 characters: an = followed by two hexadecimal digits (0–9 or A–F)
     * representing the byte's numeric value. For example, an ASCII form feed character (decimal value 12) can be
     * represented by "=0C", and an ASCII equal sign (decimal value 61) must be represented by =3D.
     * All characters except printable ASCII characters or end of line characters (but also =)
     * must be encoded in this fashion.
     *
     * All printable ASCII characters (decimal values between 33 and 126) may be represented by themselves, except =
     * (decimal 61).
     *
     * @param binarydata
     * @return 7-bit encoding of the input using QP encoding
     */
    const quotedPrintableEncode = _.flowRight([
        encodeQPTrailingSpace,
        wrapQPLines,
        normalLinebreaks,
        encodeQPSequences,
        pmcw.encode_utf8
    ]);

    // quoted printable for compatibility with old clients
    const buildPlaintextEntity = (plaintext) => {
        // mimemessagefactory doesn't handle the empty string well.
        return mimemessage.factory({
            body: quotedPrintableEncode(plaintext) || ' ',
            contentTransferEncoding: 'quoted-printable'
        });
    };

    const buildAlternateEntity = (plaintext, html, attachments) => {
        // Build the multipart/alternate MIME entity containing both the HTML and plain text entities.
        return mimemessage.factory({
            contentType: `multipart/alternative; boundary="${generateBoundary()}"`,
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
     * Builds a multipart message from the given plaintext, html bodies and attachments.
     * The html body is not necessary to create a valid mime body
     * @param {String|false} plaintext if the body should not contain plaintext should be false
     * @param {String|false} html if the body should not contain html should be false
     * @param {Array} attachments
     * @returns {String}
     */
    const build = (plaintext, html, attachments) => {
        const bodyEntity = buildBodyEntity(plaintext, html, attachments);
        const normalAttachments =
            html === false
                ? attachments
                : _.filter(attachments, ({ attachment: { Headers } }) => !embeddedUtils.isInline(Headers));
        const attachmentEntities = buildAttachments(normalAttachments);
        const body = [bodyEntity].concat(attachmentEntities);

        const msgentity = mimemessage.factory({
            contentType: `multipart/mixed; boundary="${generateBoundary()}"`,
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
