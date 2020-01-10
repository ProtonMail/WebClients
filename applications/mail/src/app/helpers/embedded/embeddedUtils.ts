import mimemessage from 'mimemessage';

import { ucFirst } from '../string';
import { Attachment } from '../../models/attachment';

export const REGEXP_CID_START = /^cid:/g;

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

export const readCID = (Headers: any = {}) => {
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
    return attachments.filter(({ Headers = {} }) => {
        const cid = readCID(Headers);
        const nodes = findEmbedded(cid, document);

        return nodes.length;
    });
};

/**
 * Convert raw headers to better format handled by the mimemessage lib
 */
export const convertMimeHeaders = (config: { [key: string]: string } = {}) => {
    const headers = Object.keys(config)
        .filter((key) => key.startsWith('content'))
        .reduce((acc, key) => {
            const [, type] = key.split('-');
            acc[`content${ucFirst(type)}`] = config[key];
            return acc;
        }, Object.create(null));

    return {
        formatted: mimemessage.factory(headers),
        headers
    };
};

export const getAttachementName = (Headers: { [key: string]: string } = {}) => {
    if (Headers['content-disposition'] !== 'inline') {
        const { formatted = {} as any } = convertMimeHeaders(Headers);
        const { params: { filename = '' } = {} } = formatted.contentDisposition() || {};
        if (filename) {
            return filename.replace(/"/g, '');
        }
    }

    return '';
};

/**
 * Get the url for an embedded image
 */
export const srcToCID = (node: Element) => {
    const attribute = node.getAttribute('data-embedded-img') || '';
    return attribute.replace(REGEXP_CID_START, '');
};
