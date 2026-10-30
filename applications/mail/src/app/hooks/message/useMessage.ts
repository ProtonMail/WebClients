import { useEffect, useState } from 'react';

import { useGetLocalID, useGetMessage } from '@proton/mail-message/hooks/message/useGetMessage';
import { messageByID } from '@proton/mail-message/store/messages/messagesSelectors';
import type { MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { initialize } from '@proton/mail-message/store/messages/read/messagesReadActions';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { useMailDispatch, useMailSelector } from '../../store/hooks';
import type { MailState } from '../../store/store';
import { useGetConversation } from '../conversation/useConversation';
import { useGetElementsFromIDs } from '../mailbox/useElements';

interface ReturnValue {
    message: MessageState;
    messageLoaded: boolean;
    bodyLoaded: boolean;
}

interface UseMessage {
    (localID: string, conversationID?: string): ReturnValue;
}

export const useMessage: UseMessage = (inputLocalID: string, conversationID = '') => {
    const dispatch = useMailDispatch();
    const getLocalID = useGetLocalID();
    const getElementsFromIDs = useGetElementsFromIDs();
    const getMessage = useGetMessage();
    const getConversationFromState = useGetConversation();

    const messageState = useMailSelector((state: MailState) => messageByID(state, { ID: inputLocalID }));

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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-AE4BBD
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
