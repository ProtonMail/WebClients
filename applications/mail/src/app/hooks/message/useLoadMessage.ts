import { useCallback } from 'react';
import { useApi } from 'react-components';
import { getMessage } from 'proton-shared/lib/api/messages';

import { Message } from '../../models/message';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
import { useInitializeMessage } from './useInitializeMessage';

export const useLoadMessage = (inputMessage: Message) => {
    const api = useApi();
    const messageCache = useMessageCache();

    return useCallback(async () => {
        const localID = inputMessage.ID || '';

        const messageFromCache = updateMessageCache(messageCache, localID, { data: inputMessage });

        // If the Body is already there, no need to send a request
        if (!messageFromCache.data?.Body) {
            const { Message: message } = await api(getMessage(messageFromCache.data?.ID));
            updateMessageCache(messageCache, localID, { data: message as Message });
        }
    }, [inputMessage]);
};

export const useReloadMessage = (localID: string) => {
    const messageCache = useMessageCache();
    const initializeMessage = useInitializeMessage(localID);

    return useCallback(async () => {
        messageCache.set(localID, { localID });
        await initializeMessage();
    }, [localID]);
};
