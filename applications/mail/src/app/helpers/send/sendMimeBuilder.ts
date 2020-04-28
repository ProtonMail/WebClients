import mimemessage from 'mimemessage';
import { arrayToBinaryString, DecryptResultPmcrypto } from 'pmcrypto';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { Api } from 'proton-shared/lib/interfaces';

import { MessageExtended, EmbeddedMap } from '../../models/message';
import { getAttachments } from '../message/messages';
import { Attachment } from '../../models/attachment';
import { get } from '../attachment/attachmentLoader';
import { readCID } from '../embedded/embeddeds';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { getPlainText, getDocumentContent } from '../message/messageContent';

// Reference: Angular/src/app/composer/services/mimeMessageBuilder.js

interface AttachmentData {
    attachment: Attachment;
    data: DecryptResultPmcrypto;
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

const getAttachmentsByType = (attachments: AttachmentData[], embeddeds: EmbeddedMap, inline: boolean) =>
    attachments.filter((attachmentData) => embeddeds.has(readCID(attachmentData.attachment)) === inline);

const getEnbeddedAttachments = (attachments: AttachmentData[], embeddeds: EmbeddedMap) =>
    getAttachmentsByType(attachments, embeddeds, true);

const getNormalAttachments = (attachments: AttachmentData[], embeddeds: EmbeddedMap) =>
    getAttachmentsByType(attachments, embeddeds, false);

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
            body: arrayToBinaryString(data.data as Uint8Array)
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

const buildEmbeddedHtml = (html: string | undefined, attachments: AttachmentData[], embeddeds: EmbeddedMap) => {
    const htmlEntity = mimemessage.factory({
        contentType: 'text/html;charset=utf-8',
        contentTransferEncoding: 'base64',
        body: html
    });

    // Attachments
    const inlineAttachments = getEnbeddedAttachments(attachments, embeddeds);
    const attachmentEntities = buildAttachments(inlineAttachments);

    // add the attachments
    const relatedBody = [htmlEntity].concat(attachmentEntities);

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
const buildAlternateEntity = (
    plaintext: string | undefined,
    html: string | undefined,
    attachments: AttachmentData[],
    embeddeds: EmbeddedMap
) =>
    mimemessage.factory({
        contentType: 'multipart/alternative',
        body: [buildPlaintextEntity(plaintext), buildEmbeddedHtml(html, attachments, embeddeds)]
    });

/**
 * Builds a mime body given the plaintext, html source and a list of attachments to fetch embedded images from
 */
const buildBodyEntity = (
    plaintext: string | undefined,
    html: string | undefined,
    attachments: AttachmentData[],
    embeddeds: EmbeddedMap
) => {
    if (html !== undefined && plaintext !== undefined) {
        return buildAlternateEntity(plaintext, html, attachments, embeddeds);
    }
    return html !== undefined ? buildEmbeddedHtml(html, attachments, embeddeds) : buildPlaintextEntity(plaintext);
};

/**
 * Builds a multipart message from the given plaintext, html bodies and attachments.
 * The html body is not necessary to create a valid mime body
 */
const build = (
    plaintext: string | undefined,
    html: string | undefined,
    attachments: AttachmentData[],
    embeddeds: EmbeddedMap
): string => {
    const bodyEntity = buildBodyEntity(plaintext, html, attachments, embeddeds);
    const normalAttachments = getNormalAttachments(attachments, embeddeds);
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
    cache: AttachmentsCache,
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
    cache: AttachmentsCache,
    api: Api,
    downconvert = true
) => {
    const plaintext = getPlainText(message, downconvert);
    const html = message.data?.MIMEType !== MIME_TYPES.PLAINTEXT ? getDocumentContent(message.document) : undefined;
    const attachments = await fetchMimeDependencies(message, cache, api);
    const embeddeds = message.embeddeds || new Map();

    return build(plaintext, html, attachments, embeddeds);
};
