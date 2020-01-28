import mimemessage from 'mimemessage';
import { BinaryResult, arrayToBinaryString } from 'pmcrypto';

import { MessageExtended } from '../../models/message';
import { getPlainText, getHTML, getAttachments } from '../message/messages';
import { Attachment } from '../../models/attachment';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { get } from '../attachment/attachmentLoader';
import { AttachmentsDataCache } from '../../hooks/useAttachments';
import { Api } from '../../models/utils';
import { getBodyParser, extractEmbedded } from '../embedded/embeddedUtils';

// Reference: Angular/src/app/composer/services/mimeMessageBuilder.js

interface AttachmentData {
    attachment: Attachment;
    data: BinaryResult;
}

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

const buildAttachments = (attachments: AttachmentData[]) =>
    attachments.map(({ attachment, data }) => {
        const attachmentName = JSON.stringify(attachment.Name);
        const headers = attachment.Headers || {};
        const contentTypeValue =
            extractContentValue(headers['content-type']) || attachment.MIMEType || 'application/octet-stream';
        const contentDispositionValue = extractContentValue(headers['content-disposition']) || 'attachment';
        const entity = mimemessage.factory({
            contentType: `${contentTypeValue}; filename=${attachmentName}; name=${attachmentName}`,
            contentTransferEncoding: 'base64',
            body: arrayToBinaryString(data.data)
        });

        entity.header(
            'content-disposition',
            `${contentDispositionValue}; filename=${attachmentName}; name=${attachmentName}`
        );

        if (headers['content-id']) {
            entity.header('content-id', headers['content-id']);
        }

        return entity;
    });

const buildEmbeddedHtml = (html?: string, attachments?: AttachmentData[]) => {
    const htmlEntity = mimemessage.factory({
        contentType: 'text/html;charset=utf-8',
        contentTransferEncoding: 'base64',
        body: html
    });

    if (attachments && attachments.length > 0) {
        console.log('attachments in mime message ignored as not supported yet', attachments);
    }
    // TODO: Attachments
    // const testDiv = embeddedUtils.getBodyParser(html);
    // const inlineAttachments = embeddedUtils.extractEmbedded(attachments, testDiv);
    // const attachmentEntities = buildAttachments(inlineAttachments);

    // add the attachments
    // const relatedBody = [htmlEntity].concat(attachmentEntities);
    const relatedBody = [htmlEntity];

    return mimemessage.factory({
        contentType: 'multipart/related',
        body: relatedBody
    });
};

/**
 * Quoted printable for compatibility with old clients
 * Mimemessagefactory doesn't handle the empty string well.
 */
const buildPlaintextEntity = (plaintext?: string) =>
    mimemessage.factory({
        body: plaintext,
        contentTransferEncoding: 'quoted-printable'
    });

/**
 * Build the multipart/alternate MIME entity containing both the HTML and plain text entities.
 */
const buildAlternateEntity = (plaintext?: string, html?: string, attachments?: AttachmentData[]) =>
    mimemessage.factory({
        contentType: 'multipart/alternative',
        body: [buildPlaintextEntity(plaintext), buildEmbeddedHtml(html, attachments)]
    });

/**
 * Builds a mime body given the plaintext, html source and a list of attachments to fetch embedded images from
 */
const buildBodyEntity = (plaintext?: string, html?: string, attachments?: AttachmentData[]) => {
    if (html !== undefined && plaintext !== undefined) {
        return buildAlternateEntity(plaintext, html, attachments);
    }
    return html !== undefined ? buildEmbeddedHtml(html, attachments) : buildPlaintextEntity(plaintext);
};

/**
 * Extracts the non-inline attachments from the given html.
 */
const getNormalAttachments = (html?: string, attachments: AttachmentData[] = []) => {
    if (html === undefined) {
        return attachments;
    }
    const testDiv = getBodyParser(html);
    const embeddedAttachments = extractEmbedded(attachments, testDiv);
    return attachments.filter((attachment) => !embeddedAttachments.includes(attachment));
};

/**
 * Builds a multipart message from the given plaintext, html bodies and attachments.
 * The html body is not necessary to create a valid mime body
 */
const build = (plaintext?: string, html?: string, attachments?: AttachmentData[]): string => {
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

const fetchMimeDependencies = async (
    message: MessageExtended,
    cache: AttachmentsDataCache,
    api: Api
): Promise<AttachmentData[]> => {
    return Promise.all(
        getAttachments(message.data).map(async (attachment) => ({
            attachment,
            data: await get(attachment, message, cache, api)
        }))
    );
};

export const constructMime = async (
    message: MessageExtended,
    cache: AttachmentsDataCache,
    api: Api,
    downconvert = true
) => {
    // TODO: ?
    // if (message.isMIME() && message.decryptedMIME) {
    //     return message.decryptedMIME;
    // }

    const plaintext = getPlainText(message, downconvert);
    const html = message.data?.MIMEType === MIME_TYPES.DEFAULT ? getHTML(message) : undefined;
    const attachments = await fetchMimeDependencies(message, cache, api);

    return build(plaintext, html, attachments);
};
