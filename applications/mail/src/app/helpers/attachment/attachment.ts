import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { extractContentValue } from '@proton/shared/lib/mail/send/helpers';

import { MessageState } from '../../logic/messages/messagesTypes';

export const updateKeyPackets = (modelMessage: MessageState, syncedMessage: MessageState) => {
    let changed = false;
    const Attachments = modelMessage.data?.Attachments?.map((attachment) => {
        const match = syncedMessage?.data?.Attachments.find(
            (syncedAttachment) => attachment.ID === syncedAttachment.ID
        );
        if (match && attachment.KeyPackets !== match.KeyPackets) {
            changed = true;
            return { ...attachment, KeyPackets: match.KeyPackets };
        }
        return attachment;
    });
    return { changed, Attachments };
};

export const getPureAttachments = (attachments: Attachment[]) => {
    return attachments.filter(({ Headers }) => {
        // If the attachment disposition is inline and has the header content-id it's an embedded image
        // In the attachment list, we want to hide embedded images so we need to filter them
        if (Headers) {
            const contentDisposition = extractContentValue(Headers['content-disposition']);
            return Headers && !(contentDisposition === 'inline' && 'content-id' in Headers);
        }
        return true;
    });
};
