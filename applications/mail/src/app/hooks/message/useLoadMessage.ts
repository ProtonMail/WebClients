import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { useCallback } from 'react';
import { useApi } from 'react-components';
import { getMessage } from 'proton-shared/lib/api/messages';
import { wait } from 'proton-shared/lib/helpers/promise';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
import { useInitializeMessage } from './useInitializeMessage';
import { LOAD_RETRY_DELAY } from '../../constants';

export const useLoadMessage = (inputMessage: Message) => {
    const api = useApi();
    const messageCache = useMessageCache();

    return useCallback(async () => {
        const localID = inputMessage.ID || '';

        const messageFromCache = updateMessageCache(messageCache, localID, { data: inputMessage });

        // If the Body is already there, no need to send a request
        if (!messageFromCache.data?.Body) {
            try {
                const { Message: message } = await api(getMessage(messageFromCache.data?.ID));
                const loadRetry = (messageCache.get(localID)?.loadRetry || 0) + 1;
                updateMessageCache(messageCache, localID, { data: message as Message, loadRetry });
            } catch (error) {
                const loadRetry = (messageCache.get(localID)?.loadRetry || 0) + 1;
                updateMessageCache(messageCache, localID, { loadRetry });
                await wait(LOAD_RETRY_DELAY);
                throw error;
            }
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
