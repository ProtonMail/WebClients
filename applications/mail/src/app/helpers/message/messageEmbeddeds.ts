import generateUID from '@proton/atoms/generateUID';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import unique from '@proton/utils/unique';

import { ENCRYPTED_STATUS } from '../../constants';
import type {
    LoadEmbeddedResults,
    MessageEmbeddedImage,
    PartialMessageState,
} from '../../store/messages/messagesTypes';
import { hash, removeLineBreaks, toUnsignedString } from '../string';
import { querySelectorAll } from './messageContent';
import { getEmbeddedImages, updateImages } from './messageImages';

const urlCreator = () => window.URL || window.webkitURL;

export const embeddableTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'];

/**
 * Removes enclosing quotes ("", '', &lt;&gt;) from a string
 */
export const trimQuotes = (input: string) => {
    const value = `${input || ''}`.trim(); // input can be a number

    if (['"', "'", '<'].indexOf(value.charAt(0)) > -1 && ['"', "'", '>'].indexOf(value.charAt(value.length - 1)) > -1) {
        return value.substring(1, value.length - 1);
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
export const readContentIDandLocation = ({ Headers = {} }: Attachment = {}) => {
    let cid = '';
    let cloc = '';

    if (Headers['content-id']) {
        cid = removeLineBreaks(trimQuotes(Headers['content-id']));
    }

    // We can find an image without cid so base64 the location
    if (Headers['content-location']) {
        cloc = removeLineBreaks(trimQuotes(Headers['content-location']));
    }

    return { cid, cloc };
};

export const matchSameCidOrLoc = (image: MessageEmbeddedImage, cid: string, cloc: string) =>
    (cid !== '' && image.cid === cid) || (cloc !== '' && image.cloc === cloc);

/**
 * Generate CID from input and email
 */
export const generateCid = (input: string, email: string) => {
    const hashValue = toUnsignedString(hash(input), 4);
    const [, domain] = getEmailParts(email);
    return `${hashValue}@${domain}`;
};

export const setEmbeddedAttr = (cid: string, cloc: string, element: Element) => {
    if (cid) {
        element.setAttribute('data-embedded-img', `cid:${cid}`);
    } else if (cloc) {
        element.setAttribute('data-embedded-img', `cloc:${cloc}`);
    }
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
export const createEmbeddedImageFromUpload = (attachment: Attachment): MessageEmbeddedImage => {
    const { cid, cloc } = readContentIDandLocation(attachment);
    return {
        type: 'embedded',
        id: generateUID('embedded'),
        cid,
        cloc,
        tracker: undefined,
        attachment,
        status: 'loaded',
    };
};

/**
 * Find embedded element in div
 */
export const findEmbedded = (cid: string, cloc: string, document: Element) => {
    let selector: string[] = [];
    // If cid and cloc are an empty string, it can give a false positive
    if (!cid && !cloc) {
        return [];
    }

    if (cid) {
        selector = [
            `img[src="${cid}"]`,
            `img[src="cid:${cid}"]`,
            `img[data-embedded-img="${cid}"]`,
            `img[data-embedded-img="cid:${cid}"]`,
            `img[data-src="cid:${cid}"]`,
            `img[proton-src="cid:${cid}"]`,
        ];
    }
    if (cloc) {
        selector = [...selector, `img[proton-src="${cloc}"]`];
    }

    return querySelectorAll({ messageDocument: { document } }, selector.join(', '));
};

/**
 * Find CIDs in content diff from the editor to detect embedded deletion
 * (with compat mode for old embedded)
 */
export const findCIDsInContent = (content: string) =>
    (content.match(/(rel=("([^"]|"")*"))|(data-embedded-img=("([^"]|"")*"))/g) || [])
        .filter((key) => key !== 'rel="noreferrer nofollow noopener"') // we don't care about links
        .filter((key) => key !== 'rel="noopener noreferrer"') // we don't care about links
        .map((key) => key.replace(/rel="|data-embedded-img="/, ''))
        .map((key) => key.slice(4, -1)); // Assume it's starts by "cid:"

/**
 * Insert actual src="cid:..." into embedded image elements
 */
export const insertActualEmbeddedImages = (document: Element) => {
    querySelectorAll({ messageDocument: { document } }, '[data-embedded-img]').forEach((element) => {
        const cidOrCloc = element.getAttribute('data-embedded-img');
        element.removeAttribute('data-embedded-img');
        element.removeAttribute('proton-src');
        element.removeAttribute('src');
        if (cidOrCloc?.startsWith('cid')) {
            element.setAttribute('src', `cid:${cidOrCloc.slice(4)}`);
        } else if (cidOrCloc?.startsWith('cloc')) {
            element.setAttribute('src', cidOrCloc.slice(5));
        }
    });
};

/**
 * Replace attachments in embedded images with new ones
 */
export const replaceEmbeddedAttachments = (
    message: PartialMessageState,
    attachments: Attachment[] | undefined = []
) => {
    const embeddedImages = getEmbeddedImages(message);
    const newEmbeddedImages = embeddedImages.map((image) => {
        const attachment = attachments.find((attachment) => {
            const { cid, cloc } = readContentIDandLocation(attachment);
            return matchSameCidOrLoc(image, cid, cloc);
        });
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
    const { cid, cloc } = readContentIDandLocation(attachment);
    const elements = findEmbedded(cid, cloc, document);
    elements.map((node) => node.remove());
};

/**
 * Set blob url src on embedded images of the document
 */
export const insertBlobImages = (document: Element, embeddedImages: MessageEmbeddedImage[]) => {
    embeddedImages.forEach((embeddedImage) => {
        const { cid, cloc, url } = embeddedImage;
        if (url) {
            findEmbedded(cid, cloc, document).forEach((element) => {
                element.removeAttribute('proton-src');
                element.setAttribute('src', url);
            });
        }
    });
};

/**
 * Based on the loadResults, update the embeddedImages with a url and the loaded state
 */
export const markEmbeddedImagesAsLoaded = (
    embeddedImages: MessageEmbeddedImage[],
    loadResults: { attachment: Attachment; blob: string }[]
) => {
    return embeddedImages.map((image) => {
        const result = loadResults.find((loadResult) => loadResult.attachment.ID === image.attachment.ID);
        if (result) {
            return { ...image, url: result?.blob, status: 'loaded' as 'loaded' };
        }
        return image;
    });
};

/**
 * Download and decrypt embedded images
 */
export const decryptEmbeddedImages = (
    images: MessageEmbeddedImage[],
    onLoadEmbeddedImages: (attachments: Attachment[]) => Promise<LoadEmbeddedResults>
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

    const downloadPromise = onLoadEmbeddedImages(attachments);

    return { updatedImages, downloadPromise };
};
