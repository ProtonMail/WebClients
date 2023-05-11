import { useCallback, useEffect, useState } from 'react';
import { useSelector, useStore } from 'react-redux';

import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { allMessages, localID, messageByID } from '../../logic/messages/messagesSelectors';
import { MessageState } from '../../logic/messages/messagesTypes';
import { initialize } from '../../logic/messages/read/messagesReadActions';
import { RootState, useAppDispatch } from '../../logic/store';
import { useGetConversation } from '../conversation/useConversation';
import { useGetElementsFromIDs } from '../mailbox/useElements';

export const useGetLocalID = () => {
    const store = useStore<RootState>();
    return useCallback((ID: string) => localID(store.getState(), { ID }), []);
};

export const useGetMessage = () => {
    const store = useStore<RootState>();
    return useCallback((ID: string) => messageByID(store.getState(), { ID }), []);
};

export const useGetAllMessages = () => {
    const store = useStore<RootState>();
    return useCallback(() => {
        return allMessages(store.getState());
    }, []);
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
    const dispatch = useAppDispatch();
    const getLocalID = useGetLocalID();
    const getElementsFromIDs = useGetElementsFromIDs();
    const getMessage = useGetMessage();
    const getConversationFromState = useGetConversation();

    const messageState = useSelector((state: RootState) => messageByID(state, { ID: inputLocalID }));

    const initMessage = (canDispatch = true) => {
        const localID = getLocalID(inputLocalID);

        // Selector may be late
        const messageState = getMessage(inputLocalID);

        if (messageState) {
            return messageState;
        }

        const [messageFromElementsCache] = getElementsFromIDs([localID]) as Message[];
        const conversationState = getConversationFromState(conversationID);

        const messageFromConversationState = conversationState?.Messages?.find((Message) => Message.ID === localID);
        const messageFromCache = messageFromElementsCache || messageFromConversationState;

        const message = messageFromCache ? { localID, data: messageFromCache } : { localID };

        if (canDispatch) {
            dispatch(initialize(message));
        }
        return message;
    };

    // Main subject of the hook
    // Will be updated based on an effect listening on the event manager
    // Not allowed to dispatch if not inside a useEffect to avoid warnings
    const [message, setMessage] = useState<MessageState>(() => initMessage(false));

    // Update message state and listen to cache for updates on the current message
    useEffect(() => {
        setMessage(initMessage());
    }, [inputLocalID]); // The hook can be re-used for a different message

    useEffect(() => {
        if (messageState) {
            setMessage(messageState);
        }
    }, [messageState]);

    const messageLoaded = !!message.data?.Subject;
    const bodyLoaded = !!message.messageDocument?.initialized;

    return { message, messageLoaded, bodyLoaded };
};
