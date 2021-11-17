import { useEffect, useState, useMemo } from 'react';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { MessageExtended } from '../../models/message';
import { useMessageCache, getLocalID } from '../../containers/MessageProvider';
import { useGetElementsFromIDs } from '../mailbox/useElements';
import { useGetConversation } from '../conversation/useConversation';

interface ReturnValue {
    message: MessageExtended;
    messageLoaded: boolean;
    bodyLoaded: boolean;
}

interface UseMessage {
    (localID: string, conversationID?: string): ReturnValue;
}

export const useMessage: UseMessage = (inputLocalID: string, conversationID = '') => {
    const cache = useMessageCache();
    const getElementsFromIDs = useGetElementsFromIDs();
    const getConversationFromState = useGetConversation();

    const localID = useMemo(() => getLocalID(cache, inputLocalID), [inputLocalID]);

    const initMessage = () => {
        if (cache.has(localID)) {
            return cache.get(localID) as MessageExtended;
        }

        const [messageFromElementsCache] = getElementsFromIDs([localID]) as Message[];
        const conversationState = getConversationFromState(conversationID);

        const messageFromConversationState = conversationState?.Messages?.find((Message) => Message.ID === localID);
        const messageFromCache = messageFromElementsCache || messageFromConversationState;

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

    const messageLoaded = !!message.data?.Subject;
    const bodyLoaded = !!message.initialized;

    return { message, messageLoaded, bodyLoaded };
};
