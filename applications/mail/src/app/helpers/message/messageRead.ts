import { getMessage } from '@proton/shared/lib/api/messages';
import type { Api } from '@proton/shared/lib/interfaces';
import type { GetMessageResponse } from '@proton/shared/lib/interfaces/mail/Message';

import type { MessageState, MessageStateWithDataFull } from '../../store/messages/messagesTypes';

export const loadMessage = async (message: MessageState, api: Api): Promise<MessageStateWithDataFull> => {
    const messageID = message.data?.ID;
    /**
     * If the Body is already there, no need to send a request
     * messageID is type guard
     */
    if (!message.data?.Body && messageID) {
        const { Message } = await api<GetMessageResponse>(getMessage(messageID));
        if (Message) {
            return { ...message, data: Message };
        }
    }

    return message as MessageStateWithDataFull;
};
