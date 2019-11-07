import { useState, useCallback } from 'react';
import { useApi, useEventManager } from 'react-components';
import { markMessageAsRead, getMessage } from 'proton-shared/lib/api/messages';

export const useLoadMessage = (inputMessage) => {
    const api = useApi();
    const { call } = useEventManager();

    const [message, setMessage] = useState(inputMessage);

    const loadMessage = useCallback(async () => {
        const markAsRead = async () => {
            if (message.Unread) {
                await api(markMessageAsRead([message.ID]));
                await call();
            }
        };

        const loadBody = async () => {
            // If the Body is already there, no need to send a request
            if (!message.Body) {
                const { Message } = await api(getMessage(message.ID));
                setMessage(Message);
                return Message;
            }

            return message;
        };

        const loadedMessage = await loadBody();
        setMessage(loadedMessage);
        markAsRead(); // No await to not slow down the UX
        return loadedMessage;
    });

    return [message, loadMessage];
};
