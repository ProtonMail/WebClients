import { MessageExtended, EmbeddedMap } from '../../models/message';
import { REGEXP_CID_START, readCID, createEmbeddedMap } from './embeddeds';
import { Attachment } from '../../models/attachment';
import { getAttachments } from '../message/messages';

export const getAttachment = (cids?: EmbeddedMap, src = '') => {
    const cid = src.replace(REGEXP_CID_START, '');
    return cids?.get(cid);
};

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
        `img[proton-src="cid:${cid}"]`
    ];
    return [...document.querySelectorAll(selector.join(', '))];
};

/**
 * Extract embedded attachment from body
 */
export const extractEmbedded = (attachments: Attachment[] = [], document: Element) => {
    return attachments.filter((attachment) => {
        const cid = readCID(attachment);
        const nodes = findEmbedded(cid, document);

        return nodes.length;
    });
};

/**
 * Find embedded images in the document and return a map based on the CID
 */
export const find = (message: MessageExtended, document: Element) => {
    const attachements = getAttachments(message.data);

    if (!attachements.length || !document) {
        return createEmbeddedMap();
    }

    const embeddedAttachments = extractEmbedded(attachements, document);

    return createEmbeddedMap(embeddedAttachments.map((attachment) => [readCID(attachment), { attachment }]));
};
