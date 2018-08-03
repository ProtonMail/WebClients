import { isInlineEmbedded } from '../../../helpers/imageHelper';

/* @ngInject */
function embedded(embeddedFinder, embeddedStore, embeddedParser, embeddedUtils) {
    const REGEXP_CID_START = /^cid:/g;

    /**
     * Parse a message in order to
     *     - Find all of its attachments
     *     - Store blobs per attachment
     *     - Bind blobs or cid to the body
     * @param  {Message} message
     * @param  {String} direction blob | cid
     * @param  {String} text      Alternative body to parse
     * @return {Promise}
     */
    const parser = (message, { direction = 'blob', text = '', isOutside = false } = {}) => {
        const content = text || message.getDecryptedBody();

        if (!embeddedFinder.find(message)) {
            /**
             * cf #5088 we need to escape the body again if we forgot to set the password First.
             * Prevent unescaped HTML.
             *
             * Don't do it everytime because it's "slow" and we don't want to slow down the process.
             */
            if (isOutside) {
                return Promise.resolve(embeddedParser.escapeHTML(message, direction, content));
            }

            return Promise.resolve(content);
        }

        return embeddedParser
            .decrypt(message)
            .then(() => embeddedParser.escapeHTML(message, direction, content))
            .catch((error) => {
                console.error(error);
                throw error;
            });
    };

    const addEmbedded = (message, cid, data, MIME) => {
        embeddedStore.store(message, cid)(data, MIME);
        return embeddedStore.getBlob(cid);
    };

    /**
     * Get the url for an embedded image
     * @param  {Node} node Image
     * @return {String}
     */
    const getUrl = (node) => {
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
     * Check if attachment exist
     * @param  {Resource} message
     * @param  {String} src - cid:url
     * @return {Object}
     */
    const getAttachment = (message, src) => {
        const cid = src.replace(REGEXP_CID_START, '');
        const contains = embeddedFinder.find(message);

        if (contains) {
            return embeddedStore.cid.get(message)[cid] || {};
        }
    };

    return {
        parser,
        addEmbedded,
        getUrl,
        getAttachment,
        isEmbedded: embeddedUtils.isEmbedded,
        getCid: embeddedUtils.readCID,
        getBlob: embeddedStore.getBlobValue,
        deallocator: embeddedStore.deallocate,
        clean: embeddedStore.cleanMemory,
        removeEmbedded: embeddedParser.removeEmbeddedHTML,
        exist: embeddedStore.cid.exist,
        generateCid: embeddedUtils.generateCid
    };
}
export default embedded;
