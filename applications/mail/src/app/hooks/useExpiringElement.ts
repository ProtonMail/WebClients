import { useMemo } from 'react';

import { getUnixTime } from 'date-fns';

import type { Conversation } from '../models/conversation';
import type { Element } from '../models/element';
import { useGetAllMessages, useGetMessage } from './message/useMessage';

const isConversationMode = (element: Element, conversationMode: boolean): element is Conversation => conversationMode;

export const useExpiringElement = (element: Element, labelID: string, conversationMode = false) => {
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
                const label = element.Labels?.find((label) => label.ID === labelID);
                if (label?.ContextExpirationTime) {
                    return label.ContextExpirationTime;
                }
                // If the element is a conversation we check all messages to find a message having draft flags and being in the conversation
                const allMessages = getAllMessages();
                const expiringMessageFromConversation = allMessages.find(
                    (message) => message?.data?.ConversationID === element.ID && !!message?.draftFlags?.expiresIn
                );

                const draftExpirationTime = expiringMessageFromConversation?.draftFlags?.expiresIn
                    ? getUnixTime(expiringMessageFromConversation.draftFlags?.expiresIn)
                    : 0;
                const expirationTime =
                    expiringMessageFromConversation?.data?.ExpirationTime || draftExpirationTime || 0;

                return expirationTime;
            } else {
                if (element.ExpirationTime) {
                    return element.ExpirationTime;
                }
                // If the element is a message we check if we have an expiration time in draftFlags
                const message = getMessage(element.ID);

                const draftExpirationTime = message?.draftFlags?.expiresIn
                    ? getUnixTime(message.draftFlags?.expiresIn)
                    : 0;
                const expirationTime = message?.data?.ExpirationTime || draftExpirationTime || 0;

                return expirationTime;
            }
        }
        return undefined;
    }, [labelID, element, conversationMode]);

    return {
        expirationTime,
        hasExpiration: !!expirationTime && expirationTime > 0,
    };
};
