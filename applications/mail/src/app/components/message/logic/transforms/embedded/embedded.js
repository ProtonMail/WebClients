import { isInlineEmbedded } from '../../../helpers/imageHelper';
import { escapeSrc, unescapeSrc } from '../../../helpers/domHelper';
import * as embeddedFinder from './embeddedFinder';
import * as embeddedUtils from './embeddedUtils';
import * as embeddedStore from './embeddedStore';
import * as embeddedParser from './embeddedParser';

const REGEXP_CID_START = /^cid:/g;

const escape = ({ document }) => (document.innerHTML = escapeSrc(document.innerHTML));
const unescape = ({ document }) => (document.innerHTML = unescapeSrc(document.innerHTML));

/**
 * Parse a message in order to
 *     - Find all of its attachments
 *     - Store blobs per attachment
 *     - Bind blobs or cid to the body
 * @param  {Message} message
 * @param  {MailSettingsModel} mailSettings
 * @param  {String} direction blob | cid
 * @param  {String} text      Alternative body to parse
 * @return {Promise}
 */
export const parser = async (
    message,
    mailSettings,
    { direction = 'blob', isOutside = false, attachmentLoader } = {}
) => {
    if (!embeddedFinder.find(message)) {
        /**
         * cf #5088 we need to escape the body again if we forgot to set the password First.
         * Prevent unescaped HTML.
         *
         * Don't do it everytime because it's "slow" and we don't want to slow down the process.
         */
        if (isOutside) {
            escape(message);
            embeddedParser.mutateHTML(message, direction);
            unescape(message);
            return { document: message.document };
        }

        return {};
    }

    escape(message);
    await embeddedParser.decrypt(message, mailSettings, attachmentLoader);
    embeddedParser.mutateHTML(message, direction);
    unescape(message);
    return { document: message.document };
};

export const addEmbedded = (message, cid, data, MIME) => {
    embeddedStore.store(message, cid)(data, MIME);
    return embeddedStore.getBlob(cid);
};

/**
 * Get the url for an embedded image
 * @param  {Node} node Image
 * @return {String}
 */
export const getUrl = (node) => {
    // If it's an inline embedded img, just return the src because that contains the img data.
    const src = node.getAttribute('data-embedded-img') || '';
    if (isInlineEmbedded(src)) {
        return src;
    }
    const cid = embeddedUtils.srcToCID(node);
    const { url = '' } = embeddedStore.getBlob(cid);
    return url;
};

/**
 * Check if attachment exist inside the dom
 * @param  {Message} message
 * @param  {Document} html Message body parser
 * @return {Function}
 */
export const getAttachment = (message) => {
    /**
     * @param  {String} src - cid:url
     */
    return (src) => {
        const cid = src.replace(REGEXP_CID_START, '');
        const contains = embeddedFinder.find(message);
        if (contains) {
            return embeddedStore.cid.get(message)[cid] || {};
        }
    };
};

// return {
//     parser,
//     addEmbedded,
//     getUrl,
//     getAttachment,
//     isEmbedded: embeddedUtils.isEmbedded,
//     getCid: embeddedUtils.readCID,
//     getBlob: embeddedStore.getBlobValue,
//     deallocator: embeddedStore.deallocate,
//     clean: embeddedStore.cleanMemory,
//     removeEmbedded: embeddedParser.removeEmbeddedHTML,
//     exist: embeddedStore.cid.exist,
//     generateCid: embeddedUtils.generateCid
// };
