import mimemessage from 'mimemessage';

// import { toUnsignedString, ucFirst } from '../../../helpers/string';
import { ucFirst } from '../../../helpers/stringHelper';
// import transformEscape from '../../message/helpers/transformEscape';

const REGEXP_CID_START = /^cid:/g;

/**
 * Convert raw headers to better format handled by the mimemessage lib
 * @param  {Object} config   Current attachment headers
 * @return {Object}          { formated: <Object>, headers: Object }
 */
export const convertMimeHeaders = (config = {}) => {
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

/**
 * Flush the container HTML and return the container
 * @param {String} content
 * @return {Node} Empty DIV
 */
// const getBodyParser = (content = '', activeCache = false) => {
//     return transformEscape(content, {
//         action: '',
//         activeCache,
//         isDocument: false,
//         cache: cacheBase64
//     });
// };

/**
 * Removes enclosing quotes ("", '', &lt;&gt;) from a string
 * @param {String} value - String to be converted
 * @return {String} value - Converted string
 */
function trimQuotes(input) {
    const value = `${input || ''}`.trim(); // input can be a number

    if (['"', "'", '<'].indexOf(value.charAt(0)) > -1 && ['"', "'", '>'].indexOf(value.charAt(value.length - 1)) > -1) {
        return value.substr(1, value.length - 2);
    }

    return value;
}

export const readCID = (Headers = {}) => {
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
 * @param {String} cid
 * @param {HTMLElement} testDiv
 * @return {Array}
 */
export const findEmbedded = (cid, testDiv) => {
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
    return [].slice.call(testDiv.querySelectorAll(selector.join(', ')));
};

/**
 * Check if an attachment is embedded
 * @param {Object} attachment
 * @param {String} body
 * @return {Boolean}
 */
// const isEmbedded = ({ Headers = {}, MIMEType = '' }, body = '') => {
//     const testDiv = body ? getBodyParser(body) : document.createElement('DIV');
//     const cid = readCID(Headers);
//     const nodes = findEmbedded(cid, testDiv);

//     return nodes.length && attachmentFileFormat.isEmbedded(MIMEType);
// };

/**
 * Extract embedded attachment from body
 * @param {Array} attachments
 * @param {Node} testDiv
 * @return {Array}
 */
export const extractEmbedded = (attachments = [], testDiv) => {
    return attachments.filter(({ Headers = {} }) => {
        const cid = readCID(Headers);
        const nodes = findEmbedded(cid, testDiv);

        return nodes.length;
    });
};

export const getAttachementName = (Headers = {}) => {
    if (Headers['content-disposition'] !== 'inline') {
        const { formatted = {} } = convertMimeHeaders(Headers);
        const { params: { filename } = {} } = formatted.contentDisposition() || {};
        if (filename) {
            return filename.replace(/"/g, '');
        }
    }

    return '';
};

/**
 * Generate CID from input and email
 * @param {String} input
 * @param {String} email
 * @return {String} cid
 */
// const generateCid = (input, email) => {
//     const hash = toUnsignedString(tools.hash(input), 4);
//     const domain = email.split('@')[1];
//     return `${hash}@${domain}`;
// };

/**
 * Get the url for an embedded image
 * @param  {Node} node Image
 * @return {String}
 */
export const srcToCID = (node) => {
    const attribute = node.getAttribute('data-embedded-img') || '';
    return attribute.replace(REGEXP_CID_START, '');
};

export const getBlobFromURL = (url = '') => {
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        xhr.onload = function onload() {
            if (xhr.status === 200) {
                return resolve(xhr.response);
            }
            reject(xhr.response);
        };

        xhr.send();
    });
};
