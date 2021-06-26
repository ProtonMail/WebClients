import { Api } from 'proton-shared/lib/interfaces';
import { getMessage } from 'proton-shared/lib/api/messages';
import { MessageExtended, MessageExtendedWithData } from '../../models/message';

export const loadMessage = async (message: MessageExtended, api: Api): Promise<MessageExtendedWithData> => {
    // If the Body is already there, no need to send a request
    if (!message.data?.Body) {
        const { Message } = await api(getMessage(message.data?.ID));
        return { ...message, data: Message };
    }

    return message as MessageExtendedWithData;
};
