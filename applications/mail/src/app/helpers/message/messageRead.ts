import { getMessage } from '@proton/shared/lib/api/messages';
import { Api } from '@proton/shared/lib/interfaces';

import { MessageState, MessageStateWithData } from '../../logic/messages/messagesTypes';

export const loadMessage = async (message: MessageState, api: Api): Promise<MessageStateWithData> => {
    const messageID = message.data?.ID;
    /**
     * If the Body is already there, no need to send a request
     * messageID is type guard
     */
    if (!message.data?.Body && messageID) {
        const { Message } = await api(getMessage(messageID));
        return { ...message, data: Message };
    }

    return message as MessageStateWithData;
};
