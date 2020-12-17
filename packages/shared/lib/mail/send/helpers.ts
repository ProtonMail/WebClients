import mimemessage from 'mimemessage';
import { AttachmentDirect } from '../../interfaces/mail/crypto';

/**
 * Remove '; name=' and '; filename=' values
 */
const extractContentValue = (value = '') => {
    const semicolonIndex = value.indexOf(';');
    if (semicolonIndex === -1) {
        return value;
    }
    return value.substr(0, semicolonIndex);
};

const buildAttachment = (attachmentData: { attachment: AttachmentDirect; data: string }) => {
    const { attachment, data } = attachmentData;
    const attachmentName = JSON.stringify(attachment.Filename);
    const headers = attachment.Headers || {};
    const contentTypeValue =
        extractContentValue(headers['content-type']) || attachment.MIMEType || 'application/octet-stream';
    const contentDispositionValue = extractContentValue(headers['content-disposition']) || 'attachment';
    const entity = mimemessage.factory({
        contentType: `${contentTypeValue}; filename=${attachmentName}; name=${attachmentName}`,
        contentTransferEncoding: 'base64',
        body: data,
    });

    entity.header(
        'content-disposition',
        `${contentDispositionValue}; filename=${attachmentName}; name=${attachmentName}`
    );

    if (headers['content-id']) {
        entity.header('content-id', headers['content-id']);
    }

    return entity;
};

/**
 * Quoted printable for compatibility with old clients
 * Mimemessagefactory doesn't handle the empty string well.
 */
const buildPlaintextEntity = (plaintext?: string) => {
    const entity = mimemessage.factory({
        body: plaintext,
        contentTransferEncoding: 'quoted-printable',
    });
    if (!plaintext) {
        // the mimemessage library is buggy in this case and converts an empty string into 'null'
        entity.internalBody = '';
    }
    return entity;
};

export const constructMime = (
    plaintext: string,
    attachmentData: { attachment: AttachmentDirect; data: string }
): string => {
    const bodyEntity = buildPlaintextEntity(plaintext);
    const attachmentEntities = buildAttachment(attachmentData);
    const body = [bodyEntity].concat(attachmentEntities);

    const msgentity = mimemessage.factory({
        contentType: 'multipart/mixed',
        body,
    });

    // this trailing line space is important: if it's not there outlook.com adds it and breaks pgp/mime signatures.
    return `${msgentity.toString()}\r\n`;
};
