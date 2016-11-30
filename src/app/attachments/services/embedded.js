angular.module('proton.attachments')
.factory('embedded', (embeddedFinder, embeddedStore, embeddedParser, embeddedUtils) => {

    const REGEXP_CID_START = /^cid:/g;

    /**
     * Parse a message in order to
     *     - Find an lot its attachments
     *     - Store blobs per attachment
     *     - Bind blobs or cid to the body
     * @param  {Message} message
     * @param  {String} direction blob | cid
     * @param  {String} text      Alternative body to parse
     * @return {Promise}
     */
    const parser = (message, direction = 'blob', text = '') => {
        embeddedStore.cid.init();

        const content = text || message.getDecryptedBody();

        if (!embeddedFinder.find(message)) {
            return Promise.resolve(content);
        }

        return embeddedParser.decrypt(message)
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
        parser, addEmbedded, getUrl, getAttachment,
        isEmbedded: embeddedUtils.isEmbedded,
        getCid: embeddedUtils.readCID,
        getBlob: embeddedStore.getBlobValue,
        deallocator: embeddedStore.deallocate,
        removeEmbedded: embeddedParser.removeEmbeddedHTML,
        exist: embeddedStore.cid.exist,
        generateCid: embeddedUtils.generateCid
    };
});
