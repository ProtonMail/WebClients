import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { useEffect, useState, useMemo } from 'react';

import { MessageExtended, MessageAction } from '../../models/message';
import { useMessageCache, getLocalID } from '../../containers/MessageProvider';
import { useGetElementsFromIDs } from '../useElementsCache';
import { useConversationCache } from '../../containers/ConversationProvider';

interface ReturnValue {
    message: MessageExtended;
    addAction: <T>(action: MessageAction<T>) => Promise<T>;
    loading: boolean;
    messageLoaded: boolean;
    bodyLoaded: boolean;
}

interface UseMessage {
    (localID: string, conversationID?: string): ReturnValue;
}

export const useMessage: UseMessage = (inputLocalID: string, conversationID = '') => {
    const cache = useMessageCache();
    const getElementsFromIDs = useGetElementsFromIDs();
    const conversationCache = useConversationCache();

    const localID = useMemo(() => getLocalID(cache, inputLocalID), [inputLocalID]);

    const initMessage = () => {
        if (cache.has(localID)) {
            return cache.get(localID) as MessageExtended;
        }

        const [messageFromElementsCache] = getElementsFromIDs([localID]) as Message[];
        const conversationFromCache = conversationCache.get(conversationID);
        const messageFromConversationCache = conversationFromCache?.Messages?.find((Message) => Message.ID === localID);
        const messageFromCache = messageFromElementsCache || messageFromConversationCache;

        const message = messageFromCache ? { localID, data: messageFromCache } : { localID };

        cache.set(localID, message);
        return message;
    };

    // Main subject of the hook
    // Will be updated based on an effect listening on the event manager
    const [message, setMessage] = useState<MessageExtended>(initMessage);

    // Update message state and listen to cache for updates on the current message
    useEffect(() => {
        setMessage(initMessage());

        return cache.subscribe((changedMessageID) => {
            // Prevent updates on message deletion from the cache to prevent undefined message in state.
            if (changedMessageID === localID && cache.has(localID)) {
                setMessage(cache.get(localID) as MessageExtended);
            }
        });
    }, [localID, cache]); // The hook can be re-used for a different message

    const addAction = <T>(action: MessageAction<T>) => {
        return new Promise<T>((resolve, reject) => {
            const wrapper = async () => {
                try {
                    resolve(await action());
                } catch (error) {
                    reject(error);
                }
            };

            const messageFromCache = cache.get(localID) as MessageExtended;
            const actionQueue = [...(messageFromCache?.actionQueue || []), wrapper];
            cache.set(localID, { ...messageFromCache, actionQueue });
        });
    };

    const loading = !Object.prototype.hasOwnProperty.call(message, 'actionStatus') || !!message?.actionInProgress;
    const messageLoaded = !!message.data?.Subject;
    const bodyLoaded = !!message.initialized;

    return { message, addAction, loading, messageLoaded, bodyLoaded };
};
