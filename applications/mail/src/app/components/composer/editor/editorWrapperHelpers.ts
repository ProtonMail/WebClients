import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

import { readContentIDandLocation } from 'proton-mail/helpers/message/messageEmbeddeds';

export const getAttachedCIDs = (message: MessageState) => {
    if (!message.data?.Attachments) {
        return [];
    }

    return message.data.Attachments.map((attachment) => readContentIDandLocation(attachment).cid);
};
