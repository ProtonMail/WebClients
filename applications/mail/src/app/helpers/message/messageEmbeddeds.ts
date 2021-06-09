import { unique } from 'proton-shared/lib/helpers/array';
import { getEmailParts } from 'proton-shared/lib/helpers/email';
import generateUID from 'proton-shared/lib/helpers/generateUID';
import { Api } from 'proton-shared/lib/interfaces';
import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { ENCRYPTED_STATUS } from '../../constants';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { MessageCache } from '../../containers/MessageProvider';
import { MessageEmbeddedImage, MessageKeys, MessageVerification, PartialMessageExtended } from '../../models/message';
import { get } from '../attachment/attachmentLoader';
import { UploadResult } from '../attachment/attachmentUploader';
import { hash, toUnsignedString } from '../string';
import { querySelectorAll } from './messageContent';
import { getEmbeddedImages, updateImages } from './messageImages';

const urlCreator = () => window.URL || window.webkitURL;

export const embeddableTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'];

/**
 * Removes enclosing quotes ("", '', &lt;&gt;) from a string
 */
const trimQuotes = (input: string) => {
    const value = `${input || ''}`.trim(); // input can be a number

    if (['"', "'", '<'].indexOf(value.charAt(0)) > -1 && ['"', "'", '>'].indexOf(value.charAt(value.length - 1)) > -1) {
        return value.substr(1, value.length - 2);
    }

    return value;
};

/**
 * Is a file type embeddable or not
 */
export const isEmbeddable = (fileType: string) => embeddableTypes.includes(fileType);

/**
 * Read CID of the attachment (through its header)
 */
export const readCID = ({ Headers = {} }: Attachment = {}) => {
    if (Headers['content-id']) {
        return trimQuotes(Headers['content-id']);
    }

    // We can find an image without cid so base64 the location
    if (Headers['content-location']) {
        return trimQuotes(Headers['content-location']);
    }

    return '';
};

/**
 * Generate CID from input and email
 */
export const generateCid = (input: string, email: string) => {
    const hashValue = toUnsignedString(hash(input), 4);
    const [, domain] = getEmailParts(email);
    return `${hashValue}@${domain}`;
};

/**
 * Create a Blob and its URL for an attachment
 */
export const createBlob = (attachment: Attachment, data: Uint8Array | string) => {
    const blob = new Blob([data], { type: attachment.MIMEType });
    return urlCreator().createObjectURL(blob);
};

/**
 * Prepare MessageEmbeddedImage structure based on an upload result
 */
export const createEmbeddedImageFromUpload = (upload: UploadResult): MessageEmbeddedImage => ({
    type: 'embedded',
    id: generateUID('embedded'),
    cid: readCID(upload.attachment),
    attachment: upload.attachment,
    status: 'loaded',
});

/**
 * Find embedded element in div
 */
export const findEmbedded = (cid: string, document: Element) => {
    // If cid is an empty string, it can give a false positive
    if (!cid) {
        return [];
    }
    const selector = [
        `img[src="${cid}"]`,
        `img[src="cid:${cid}"]`,
        `img[data-embedded-img="${cid}"]`,
        `img[data-embedded-img="cid:${cid}"]`,
        `img[data-src="cid:${cid}"]`,
        `img[proton-src="cid:${cid}"]`,
    ];

    return querySelectorAll({ document }, selector.join(', '));
};

/**
 * Find CIDs in content diff from the editor to detect embedded deletion
 * (with compat mode for old embedded)
 */
export const findCIDsInContent = (content: string) =>
    (content.match(/(rel=("([^"]|"")*"))|(data-embedded-img=("([^"]|"")*"))/g) || [])
        .filter((key) => key !== 'rel="noreferrer nofollow noopener"') // we don't care about links
        .map((key) => key.replace(/rel="|data-embedded-img="/, ''))
        .map((key) => key.slice(0, -1));

/**
 * Insert actual src="cid:..." into embedded image elements
 */
export const insertActualEmbeddedImages = (document: Element, embeddedImages: MessageEmbeddedImage[]) => {
    embeddedImages.forEach((image) => {
        const match = document.querySelector(`[data-embedded-img="${image.cid}"]`);
        match?.removeAttribute('data-embedded-img');
        match?.setAttribute('src', `cid:${image.cid}`);
    });
};

/**
 * Replace attachments in embedded images with new ones
 */
export const replaceEmbeddedAttachments = (
    message: PartialMessageExtended,
    attachments: Attachment[] | undefined = []
) => {
    const embeddedImages = getEmbeddedImages(message);
    const newEmbeddedImages = embeddedImages.map((image) => {
        const attachment = attachments.find((attachment) => readCID(attachment) === image.cid);
        if (attachment) {
            return { ...image, attachment };
        }
        return image;
    });
    return updateImages(message.messageImages, undefined, undefined, newEmbeddedImages);
};

/**
 * Remove an embedded attachment from the document
 */
export const removeEmbeddedHTML = (document: Element, attachment: Attachment) => {
    const cid = readCID(attachment);
    const elements = findEmbedded(cid, document);
    elements.map((node) => node.remove());
};

/**
 * Download and decrypt embedded images
 */
export const decryptEmbeddedImages = (
    images: MessageEmbeddedImage[],
    localID: string,
    messageVerification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    messageCache: MessageCache,
    attachmentCache: AttachmentsCache,
    api: Api
) => {
    const attachments = unique(
        images
            .filter(({ status }) => status === 'not-loaded')
            .filter((info) => info.attachment.KeyPackets || info.attachment.Encrypted === ENCRYPTED_STATUS.PGP_MIME)
            .map((image) => (image as MessageEmbeddedImage).attachment)
    );

    const updatedImages = images.map((image) => {
        if (attachments.includes(image.attachment) && image.status === 'not-loaded') {
            return { ...image, status: 'loading' } as MessageEmbeddedImage;
        }
        return image;
    });

    const download = async () => {
        const results = await Promise.all(
            attachments.map(async (attachment) => {
                const buffer = await get(attachment, messageVerification, messageKeys, attachmentCache, api);
                return {
                    attachment,
                    blob: createBlob(attachment, buffer.data as Uint8Array),
                };
            })
        );

        const message = messageCache.get(localID);
        if (message && message.messageImages) {
            const messageImages = updateImages(
                message.messageImages,
                undefined,
                undefined,
                getEmbeddedImages(message).map((image) => {
                    const result = results.find((result) => result.attachment === image.attachment);
                    if (result) {
                        return { ...image, url: result?.blob, status: 'loaded' };
                    }
                    return image;
                })
            );

            messageCache.set(localID, { ...message, messageImages });
        }
    };

    void download();

    return updatedImages;
};
