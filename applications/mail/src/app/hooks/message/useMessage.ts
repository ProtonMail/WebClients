import { useEffect, useState, useCallback } from 'react';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { useStore, useDispatch, useSelector } from 'react-redux';
import { useGetElementsFromIDs } from '../mailbox/useElements';
import { useGetConversation } from '../conversation/useConversation';
import { MessageState } from '../../logic/messages/messagesTypes';
import { RootState } from '../../logic/store';
import { localID, messageByID } from '../../logic/messages/messagesSelectors';
import { initialize } from '../../logic/messages/messagesActions';

export const useGetLocalID = () => {
    const store = useStore<RootState>();
    return useCallback((ID: string) => localID(store.getState(), { ID }), []);
};

export const useGetMessage = () => {
    const store = useStore<RootState>();
    return useCallback((ID: string) => messageByID(store.getState(), { ID }), []);
};

interface ReturnValue {
    message: MessageState;
    messageLoaded: boolean;
    bodyLoaded: boolean;
}

interface UseMessage {
    (localID: string, conversationID?: string): ReturnValue;
}

export const useMessage: UseMessage = (inputLocalID: string, conversationID = '') => {
    // const cache = useMessageCache();
    const dispatch = useDispatch();
    const getLocalID = useGetLocalID();
    const getElementsFromIDs = useGetElementsFromIDs();
    const getConversationFromState = useGetConversation();

    // const localID = useMemo(() => getLocalID(cache, inputLocalID), [inputLocalID]);

    const messageState = useSelector((state: RootState) => messageByID(state, { ID: inputLocalID }));

    const initMessage = () => {
        // if (cache.has(localID)) {
        //     return cache.get(localID) as MessageState;
        // }
        if (messageState) {
            return messageState;
        }

        const localID = getLocalID(inputLocalID);

        const [messageFromElementsCache] = getElementsFromIDs([localID]) as Message[];
        const conversationState = getConversationFromState(conversationID);

        const messageFromConversationState = conversationState?.Messages?.find((Message) => Message.ID === localID);
        const messageFromCache = messageFromElementsCache || messageFromConversationState;

        const message = messageFromCache ? { localID, data: messageFromCache } : { localID };

        // cache.set(localID, message);
        dispatch(initialize(messageFromCache));
        return message;
    };

    // Main subject of the hook
    // Will be updated based on an effect listening on the event manager
    const [message, setMessage] = useState<MessageState>(initMessage);

    // Update message state and listen to cache for updates on the current message
    useEffect(() => {
        setMessage(initMessage());

        // return cache.subscribe((changedMessageID) => {
        //     // Prevent updates on message deletion from the cache to prevent undefined message in state.
        //     if (changedMessageID === localID && cache.has(localID)) {
        //         setMessage(cache.get(localID) as MessageState);
        //     }
        // });
    }, [localID]); // The hook can be re-used for a different message

    useEffect(() => {
        if (messageState) {
            setMessage(messageState);
        }
    }, [messageState]);

    const messageLoaded = !!message.data?.Subject;
    const bodyLoaded = !!message.messageDocument?.initialized;

    return { message, messageLoaded, bodyLoaded };
};
