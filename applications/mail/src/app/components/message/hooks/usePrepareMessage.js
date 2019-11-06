import { useState, useEffect, useCallback } from 'react';
import { useApi, useEventManager } from 'react-components';
import { markMessageAsRead, getMessage } from 'proton-shared/lib/api/messages';
import { useGetDecryptedMessage } from './useGetDecryptedMessage';
import { useFormatContent } from './useFormatContent';

const initialMetadata = {
    expanded: false,
    loading: false,
    loaded: false,
    content: null,
    showImages: false
};

export const usePrepareMessage = (inputMessage) => {
    const api = useApi();
    const { call } = useEventManager();
    const getDecryptedMessage = useGetDecryptedMessage();
    const formatContent = useFormatContent();

    const [message, setMessage] = useState(inputMessage);
    const [messageMetadata, setMessageMetadata] = useState(initialMetadata);

    // If the message change, reset the metadata
    useEffect(() => {
        setMessage(inputMessage);
        setMessageMetadata(initialMetadata);
    }, [inputMessage.ID]);

    const load = useCallback(async () => {
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

        setMessageMetadata({
            ...messageMetadata,
            expanded: true,
            loading: true
        });

        const loadedMessage = await loadBody();
        const rawContent = await getDecryptedMessage(loadedMessage);
        markAsRead(); // No await to not slow down the UX
        const { content, metadata } = await formatContent(rawContent, loadedMessage);

        setMessageMetadata({
            ...messageMetadata,
            ...metadata,
            expanded: true,
            loading: false,
            loaded: true,
            content
        });
    });

    return { message, messageMetadata, load };
};
