import { MessageExtended, Message } from '../../models/message';
import { extractEmbedded, getAttachementName, REGEXP_CID_START } from '../embedded/embeddedUtils';
import { addMessageCID, getMessageCIDs } from './embeddedStoreCids';
import { Attachment } from '../../models/attachment';

export const getAttachment = (message: Message = {}, src = '') => {
    const cid = src.replace(REGEXP_CID_START, '');
    return getMessageCIDs(message)[cid] || {};
};

export const find = (message: MessageExtended) => {
    const list = (message.data || {}).Attachments || [];

    if (!list.length || !message.document) {
        return [];
    }

    const embeddedAttachments = extractEmbedded(list, message.document);

    embeddedAttachments.forEach((attachment) => {
        addMessageCID(message.data || {}, attachment);
    });

    return embeddedAttachments;
};

/**
 * Find all attachements inline
 */
export const listInlineAttachments = (message: MessageExtended) => {
    const list = (message.data || {}).Attachments || [];
    const MAP_CID = getMessageCIDs(message.data);

    return Object.keys(MAP_CID).reduce((acc, cid) => {
        // Extract current attachement content-id
        const contentId = ((MAP_CID[cid] || {}).Headers || {})['content-id'];
        const contentName = getAttachementName(MAP_CID[cid].Headers);

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
    }, [] as { cid: string; attachment: Attachment }[]);
};
