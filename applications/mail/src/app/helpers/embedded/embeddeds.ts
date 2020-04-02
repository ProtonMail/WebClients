import mimemessage from 'mimemessage';

import { ucFirst, toUnsignedString } from '../string';
import { Attachment } from '../../models/attachment';
import { transformEscape } from '../transforms/transformEscape';
import { hash } from '../string';
import { EmbeddedInfo, EmbeddedMap } from '../../models/message';
import { UploadResult } from '../attachment/attachmentUploader';

const urlCreator = () => window.URL || window.webkitURL;

export const embeddableTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'];

export const REGEXP_CID_START = /^cid:/g;

/**
 * Flush the container HTML and return the container
 */
export const getBodyParser = (content = '') => transformEscape(content);

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
 * Generate CID from input and email
 */
export const generateCid = (input: string, email: string) => {
    const hashValue = toUnsignedString(hash(input), 4);
    const domain = email.split('@')[1];
    return `${hashValue}@${domain}`;
};

/**
 * Get the url for an embedded image
 */
export const srcToCID = (node: Element) => {
    const attribute = node.getAttribute('data-embedded-img') || '';
    return attribute.replace(REGEXP_CID_START, '');
};

export const isContentLocation = ({ Headers = {} }: Attachment = {}) =>
    typeof Headers['content-location'] !== 'undefined' && typeof Headers['content-id'] === 'undefined';

/**
 * Create a Blob and its URL for an attachment
 */
export const createBlob = (attachment: Attachment, data: Uint8Array) => {
    const blob = new Blob([data], { type: attachment.MIMEType });
    return urlCreator().createObjectURL(blob);
};

export const createEmbeddedMap = (...args: any[]) => new Map<string, EmbeddedInfo>(...args);

export const createEmbeddedInfo = (upload: UploadResult) => ({
    attachment: upload.attachment,
    url: createBlob(upload.attachment, upload.packets.Preview)
});

export const cloneEmbedddedMap = (source: EmbeddedMap | undefined) => {
    const result = createEmbeddedMap();
    source?.forEach((info, cid) => result.set(cid, info));
    return result;
};

export const isEmbeddable = (fileType: string) => embeddableTypes.includes(fileType);

export const isEmbeddedLocal = ({
    Headers: { 'content-disposition': disposition, embedded } = {}
}: Attachment = {}) => {
    return disposition === 'inline' || Number(embedded) === 1;
};
