import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { hasErrorType } from '../helpers/errors';
import { conversationByID } from '../logic/conversations/conversationsSelectors';
import { ConversationState } from '../logic/conversations/conversationsTypes';
import { messageByID } from '../logic/messages/messagesSelectors';
import { MessageState } from '../logic/messages/messagesTypes';
import { RootState } from '../logic/store';

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
    const message = useSelector((state: RootState) => messageByID(state, { ID: elementID }));
    const conversation = useSelector((state: RootState) => conversationByID(state, { ID: elementID }));

    const onChange = (labelIds: string[] | undefined) => {
        // Move out if the element is not present in the cache anymore
        if (!labelIds) {
            onBack();
            return;
        }

        // Move out if the element doesn't contain the current label
        if (!labelIds.includes(labelID)) {
            onBack();
            return;
        }
    };

    useEffect(() => {
        if (!loading && !conversationMode && message?.data?.LabelIDs) {
            // Not sure why, but message from the selector can be a render late here
            onChange(message?.data?.LabelIDs);
        }
    }, [message?.data?.LabelIDs, loading]);

    useEffect(() => {
        if (!loading && conversationMode && conversation?.Conversation.Labels) {
            // Not sure why, but message from the selector can be a render late here
            onChange(conversation?.Conversation.Labels.map((label) => label.ID));
        }
    }, [conversation?.Conversation.Labels, loading]);

    useEffect(() => {
        if (!elementID) {
            return;
        }

        const cacheEntry = conversationMode ? conversation : message;

        // Move out of a non existing message
        if (!loading && cacheEntryIsFailedLoading(conversationMode, cacheEntry)) {
            onBack();
        }
    }, [elementID, loading]);
};
