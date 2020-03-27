import { Api } from 'proton-shared/lib/interfaces';
import { getMessage, markMessageAsRead } from 'proton-shared/lib/api/messages';

import { MessageExtended } from '../../models/message';

export const loadMessage = async (message: MessageExtended, api: Api) => {
    // If the Body is already there, no need to send a request
    if (!message.data?.Body) {
        const { Message } = await api(getMessage(message.data?.ID));
        return { ...message, data: Message };
    }
    return message;
};

export const markAsRead = async (
    message: MessageExtended,
    api: Api,
    call: () => Promise<void>
): Promise<Partial<MessageExtended>> => {
    const markAsRead = async () => {
        await api(markMessageAsRead([message.data?.ID || '']));
        await call();
    };

    if (message.data?.Unread) {
        markAsRead(); // No await to not slow down the UX
        return { data: { ...message, Unread: 0 } };
    }

    return {};
};
