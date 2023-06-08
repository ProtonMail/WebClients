import { useMemo } from 'react';

import { Conversation } from '../models/conversation';
import { Element } from '../models/element';
import { useGetAllMessages, useGetMessage } from './message/useMessage';

const isConversationMode = (element: Element, conversationMode: boolean): element is Conversation => conversationMode;

export const useExpiringElement = (element: Element, conversationMode = false) => {
    const getAllMessages = useGetAllMessages();
    const getMessage = useGetMessage();

    /**
     *  We need to check if we find an expiration time set in the state.
     *  We could have sent a message recently, and ExpirationTime could not be set already.
     *  If we want to display the expiration icon in the list, we need to check the draft flag in the state
     */
    const expirationTime = useMemo(() => {
        if (element) {
            if (isConversationMode(element, conversationMode)) {
                // If the element is a conversation we check all messages to find a message having draft flags and being in the conversation
                const allMessages = getAllMessages();
                const expiringMessageFromConversation = allMessages.find(
                    (message) => message?.data?.ConversationID === element.ID && !!message?.draftFlags?.expiresIn
                );
                const draftExpirationTime = expiringMessageFromConversation?.draftFlags?.expiresIn
                    ? expiringMessageFromConversation.draftFlags?.expiresIn.getTime() / 1000
                    : 0;
                const expirationTime =
                    expiringMessageFromConversation?.data?.ExpirationTime || draftExpirationTime || 0;

                return element.ContextExpirationTime || expirationTime;
            } else {
                // If the element is a message we check if we have an expiration time in draftFlags
                const message = getMessage(element.ID);

                const draftExpirationTime = message?.draftFlags?.expiresIn
                    ? message.draftFlags?.expiresIn.getTime() / 1000
                    : 0;
                const expirationTime = message?.data?.ExpirationTime || draftExpirationTime || 0;

                return element.ExpirationTime || expirationTime;
            }
        }
        return undefined;
    }, [element, conversationMode]);

    const hasExpiration = !!expirationTime && expirationTime > 0;

    return { expirationTime, hasExpiration };
};
