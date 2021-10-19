import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useApi } from '@proton/components';
import { useInitializeMessage } from './useInitializeMessage';
import { initialize, load } from '../../logic/messages/messagesActions';

export const useLoadMessage = (inputMessage: Message) => {
    const dispatch = useDispatch();
    const api = useApi();
    // const messageCache = useMessageCache();

    return useCallback(async () => {
        // const localID = inputMessage.ID || '';
        // const messageFromCache = updateMessageCache(messageCache, localID, { data: inputMessage });
        // // If the Body is already there, no need to send a request
        // if (!messageFromCache.data?.Body) {
        //     try {
        //         const { Message: message } = await api(getMessage(messageFromCache.data?.ID));
        //         const loadRetry = (messageCache.get(localID)?.loadRetry || 0) + 1;
        //         updateMessageCache(messageCache, localID, { data: message as Message, loadRetry });
        //     } catch (error: any) {
        //         const loadRetry = (messageCache.get(localID)?.loadRetry || 0) + 1;
        //         updateMessageCache(messageCache, localID, { loadRetry });
        //         await wait(LOAD_RETRY_DELAY);
        //         throw error;
        //     }
        // }
        dispatch(load({ ID: inputMessage.ID, api }));
    }, [inputMessage]);
};

export const useReloadMessage = (localID: string) => {
    const dispatch = useDispatch();
    // const messageCache = useMessageCache();
    const initializeMessage = useInitializeMessage(localID);

    return useCallback(async () => {
        // messageCache.set(localID, { localID });
        dispatch(initialize({ localID }));
        await initializeMessage();
    }, [localID]);
};
