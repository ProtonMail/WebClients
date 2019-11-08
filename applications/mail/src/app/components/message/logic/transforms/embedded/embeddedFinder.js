import * as embeddedUtils from './embeddedUtils';
import * as embeddedStore from './embeddedStore';

export const find = (message) => {
    const list = message.data.Attachments || [];
    // message.NumEmbedded = 0;

    if (!list.length) {
        return false;
    }

    const embeddedAttachments = embeddedUtils.extractEmbedded(list, message.document);

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
export const listInlineAttachments = (message) => {
    // const list = message.getAttachments();
    const list = message.data.Attachments || [];
    const MAP_CID = embeddedStore.cid.get(message);

    return Object.keys(MAP_CID).reduce((acc, cid) => {
        // Extract current attachement content-id
        const contentId = MAP_CID[cid].Headers['content-id'];
        const contentName = embeddedUtils.getAttachementName(MAP_CID[cid].Headers);

        // Find the matching attachement
        const attachment = list.find(({ Headers = {}, Name = '' } = {}) => {
            if (Headers['content-id']) {
                return Headers['content-id'] === contentId;
            }

            if (Headers['content-location']) {
                return Name === contentName;
            }

            return false;
        });

        attachment && acc.push({ cid, attachment });
        return acc;
    }, []);
};
