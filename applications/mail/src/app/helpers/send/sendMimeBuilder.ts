import mimemessage from 'mimemessage';
import { arrayToBinaryString } from 'pmcrypto';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { Api } from 'proton-shared/lib/interfaces';
import { getAttachments, isPlainText as testIsPlainText } from 'proton-shared/lib/mail/messages';
import { MessageEmbeddedImage, MessageExtended, MessageImages, MessageKeys } from '../../models/message';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { getPlainText } from '../message/messageContent';
import { prepareExport } from '../message/messageExport';
import { Download, formatDownload } from '../attachment/attachmentDownloader';
import { readCID } from '../message/messageEmbeddeds';

// Reference: Angular/src/app/composer/services/mimeMessageBuilder.js

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

const getAttachmentsByType = (attachments: Download[], messageImages: MessageImages | undefined, inline: boolean) =>
    attachments.filter((attachmentData) => {
        const cid = readCID(attachmentData.attachment);
        const image = messageImages?.images.find((image) => (image as MessageEmbeddedImage).cid === cid);
        return !!image === inline;
    });

const getEnbeddedAttachments = (attachments: Download[], messageImages: MessageImages | undefined) =>
    getAttachmentsByType(attachments, messageImages, true);

const getNormalAttachments = (attachments: Download[], messageImages: MessageImages | undefined) =>
    getAttachmentsByType(attachments, messageImages, false);

const buildAttachments = (attachments: Download[]) =>
    attachments.map(({ attachment, data }) => {
        const attachmentName = JSON.stringify(attachment.Name);
        const headers = attachment.Headers || {};
        const contentTypeValue =
            extractContentValue(headers['content-type']) || attachment.MIMEType || 'application/octet-stream';
        const contentDispositionValue = extractContentValue(headers['content-disposition']) || 'attachment';
        const entity = mimemessage.factory({
            contentType: `${contentTypeValue}; filename=${attachmentName}; name=${attachmentName}`,
            contentTransferEncoding: 'base64',
            body: arrayToBinaryString(data),
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

const buildEmbeddedHtml = (
    html: string | undefined,
    attachments: Download[],
    messageImages: MessageImages | undefined
) => {
    const htmlEntity = mimemessage.factory({
        contentType: 'text/html;charset=utf-8',
        contentTransferEncoding: 'base64',
        body: html,
    });

    // Attachments
    const inlineAttachments = getEnbeddedAttachments(attachments, messageImages);
    const attachmentEntities = buildAttachments(inlineAttachments);

    // add the attachments
    const relatedBody = [htmlEntity].concat(attachmentEntities);

    return mimemessage.factory({
        contentType: 'multipart/related',
        body: relatedBody,
    });
};

/**
 * Quoted printable for compatibility with old clients
 * Mimemessagefactory doesn't handle the empty string well.
 */
const buildPlaintextEntity = (plaintext?: string) =>
    mimemessage.factory({
        body: plaintext,
        contentTransferEncoding: 'quoted-printable',
    });

/**
 * Build the multipart/alternate MIME entity containing both the HTML and plain text entities.
 */
const buildAlternateEntity = (
    plaintext: string | undefined,
    html: string | undefined,
    attachments: Download[],
    messageImages: MessageImages | undefined
) =>
    mimemessage.factory({
        contentType: 'multipart/alternative',
        body: [buildPlaintextEntity(plaintext), buildEmbeddedHtml(html, attachments, messageImages)],
    });

/**
 * Builds a mime body given the plaintext, html source and a list of attachments to fetch embedded images from
 */
const buildBodyEntity = (
    plaintext: string | undefined,
    html: string | undefined,
    attachments: Download[],
    messageImages: MessageImages | undefined
) => {
    if (html !== undefined && plaintext !== undefined) {
        return buildAlternateEntity(plaintext, html, attachments, messageImages);
    }
    return html !== undefined ? buildEmbeddedHtml(html, attachments, messageImages) : buildPlaintextEntity(plaintext);
};

/**
 * Builds a multipart message from the given plaintext, html bodies and attachments.
 * The html body is not necessary to create a valid mime body
 */
const build = (
    plaintext: string | undefined,
    html: string | undefined,
    attachments: Download[],
    messageImages: MessageImages | undefined
): string => {
    const bodyEntity = buildBodyEntity(plaintext, html, attachments, messageImages);
    const normalAttachments = getNormalAttachments(attachments, messageImages);
    const attachmentEntities = buildAttachments(normalAttachments);
    const body = [bodyEntity].concat(attachmentEntities);

    const msgentity = mimemessage.factory({
        contentType: 'multipart/mixed',
        body,
    });

    // this trailing line space is important: if it's not there outlook.com adds it and breaks pgp/mime signatures.
    return `${msgentity.toString()}\r\n`;
};

const fetchMimeDependencies = async (
    message: MessageExtended,
    messageKeys: MessageKeys,
    cache: AttachmentsCache,
    api: Api
): Promise<Download[]> => {
    return Promise.all(
        getAttachments(message.data).map(async (attachment) =>
            formatDownload(attachment, message.verification, messageKeys, cache, api)
        )
    );
};

export const constructMime = async (
    message: MessageExtended,
    messageKeys: MessageKeys,
    cache: AttachmentsCache,
    api: Api,
    downconvert = true
) => {
    const plaintext = getPlainText(message, downconvert);
    const html = message.data?.MIMEType !== MIME_TYPES.PLAINTEXT ? prepareExport(message) : undefined;
    const attachments = await fetchMimeDependencies(message, messageKeys, cache, api);

    return build(plaintext, html, attachments, message.messageImages);
};

export const constructMimeFromSource = async (
    message: MessageExtended,
    messageKeys: MessageKeys,
    cache: AttachmentsCache,
    api: Api
) => {
    const isDecryptionError = !!message.errors?.decryption?.length;
    let plaintext: string | undefined;
    let html: string | undefined;

    if (isDecryptionError) {
        plaintext = message.data?.Body;
    } else {
        const isPlainText = testIsPlainText(message.data);
        plaintext = isPlainText ? message.decryptedBody : undefined;
        html = isPlainText ? undefined : message.decryptedBody;
    }

    const attachments = await fetchMimeDependencies(message, messageKeys, cache, api);

    return build(plaintext, html, attachments, message.messageImages);
};
