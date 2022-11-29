import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { getLabelIDs } from '../helpers/elements';
import { hasErrorType } from '../helpers/errors';
import { conversationByID } from '../logic/conversations/conversationsSelectors';
import { ConversationState } from '../logic/conversations/conversationsTypes';
import { messageByID } from '../logic/messages/messagesSelectors';
import { MessageState } from '../logic/messages/messagesTypes';
import { RootState } from '../logic/store';
import { useGetConversation } from './conversation/useConversation';
import { useGetMessage } from './message/useMessage';

const cacheEntryToElement = (cacheEntry: MessageState | ConversationState | undefined) =>
    (cacheEntry as ConversationState)?.Conversation || (cacheEntry as MessageState)?.data || {};

const cacheEntryIsFailedLoading = (
    conversationMode: boolean,
    cacheEntry: MessageState | ConversationState | undefined
) => {
    if (conversationMode) {
        return hasErrorType(cacheEntry?.errors, 'notExist');
    }
    const messageExtended = cacheEntry as MessageState;
    return messageExtended?.data?.ID && !messageExtended?.data?.Subject;
};

interface Props {
    conversationMode: boolean;
    elementID?: string;
    onBack: () => void;
    loading: boolean;
    labelID: string;
}

export const useShouldMoveOut = ({ conversationMode, elementID = '', labelID, loading, onBack }: Props) => {
    const getMessage = useGetMessage();
    const getConversation = useGetConversation();
    const message = useSelector((state: RootState) => messageByID(state, { ID: elementID }));
    const conversation = useSelector((state: RootState) => conversationByID(state, { ID: elementID }));

    const onChange = (cacheEntry: MessageState | ConversationState | undefined) => {
        // Move out if the element is not present in the cache anymore
        if (!cacheEntry) {
            onBack();
            return;
        }

        const currentElement = cacheEntryToElement(cacheEntry);
        const currentLabelIDs = getLabelIDs(currentElement, labelID);

        // Move out if the element doesn't contain the current label
        if (!currentLabelIDs[labelID]) {
            onBack();
            return;
        }
    };

    useEffect(() => {
        if (!conversationMode) {
            // Not sure why, but message from the selector can be a render late here
            onChange(getMessage(elementID));
        }
    }, [message]);

    useEffect(() => {
        if (conversationMode) {
            // Not sure why, but message from the selector can be a render late here
            onChange(getConversation(elementID));
        }
    }, [conversation]);

    useEffect(() => {
        if (!elementID) {
            return;
        }

        const cacheEntry = conversationMode ? getConversation(elementID) : getMessage(elementID);

        // Move out of a non existing message
        if (!loading && cacheEntryIsFailedLoading(conversationMode, cacheEntry)) {
            onBack();
        }
    }, [elementID, loading]);
};
