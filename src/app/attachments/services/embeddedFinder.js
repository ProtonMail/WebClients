/* @ngInject */
function embeddedFinder(embeddedStore, embeddedUtils) {
    const find = (message) => {
        const list = message.getAttachments();
        message.NumEmbedded = 0;

        if (!list.length) {
            return false;
        }

        const body = message.getDecryptedBody();
        const embeddedAttachments = embeddedUtils.extractEmbedded(list, body);

        embeddedAttachments.forEach((attachment) => {
            embeddedStore.cid.add(message, attachment);
        });

        return embeddedStore.cid.contains(message);
    };

    /**
     * Find all attachements inline
     * @param  {Message}
     * @return {Array}
     */
    const listInlineAttachments = (message) => {
        const list = message.getAttachments();
        const MAP_CID = embeddedStore.cid.get(message);

        return Object.keys(MAP_CID).reduce((acc, cid) => {
            // Extract current attachement content-id
            const contentId = MAP_CID[cid].Headers['content-id'];
            const contentName = embeddedUtils.getAttachementName(MAP_CID[cid].Headers);

            // Find the matching attachement
            const attachment = list.filter(({ Headers = {}, Name = '' } = {}) => {
                if (Headers['content-location']) {
                    return Name === contentName;
                }
                return Headers['content-id'] === contentId;
            })[0];

            attachment && acc.push({ cid, attachment });
            return acc;
        }, []);
    };

    return { find, listInlineAttachments };
}
export default embeddedFinder;
