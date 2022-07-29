import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useFolders } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

import { getCurrentFolderIDs, hasLabel } from '../helpers/elements';
import { hasErrorType } from '../helpers/errors';
import { conversationByID } from '../logic/conversations/conversationsSelectors';
import { ConversationState } from '../logic/conversations/conversationsTypes';
import { messageByID } from '../logic/messages/messagesSelectors';
import { MessageState } from '../logic/messages/messagesTypes';
import { RootState } from '../logic/store';
import { useGetConversation } from './conversation/useConversation';
import { useGetMessage } from './message/useMessage';

const { ALL_MAIL } = MAILBOX_LABEL_IDS;

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

export const useShouldMoveOut = (
    conversationMode: boolean,
    ID: string | undefined,
    loading: boolean,
    onBack: () => void
) => {
    const getMessage = useGetMessage();
    const getConversation = useGetConversation();
    const [folders = []] = useFolders();

    const previousVersionRef = useRef<MessageState | ConversationState | undefined>();

    const message = useSelector((state: RootState) => messageByID(state, { ID: ID || '' }));
    const conversation = useSelector((state: RootState) => conversationByID(state, { ID: ID || '' }));

    const onChange = (cacheEntry: MessageState | ConversationState | undefined) => {
        // Move out of a deleted element
        if (!cacheEntry) {
            onBack();
            return;
        }

        // Move out of moved away message
        const previousElement = cacheEntryToElement(previousVersionRef.current);
        const currentElement = cacheEntryToElement(cacheEntry);
        const hadLabels = hasLabel(previousElement, ALL_MAIL);
        const previousFolderID = getCurrentFolderIDs(previousElement, folders);
        const currentFolderID = getCurrentFolderIDs(currentElement, folders);

        if (hadLabels && previousFolderID.length > 0 && !isDeepEqual(previousFolderID, currentFolderID)) {
            onBack();
            return;
        }

        previousVersionRef.current = cacheEntry;
    };

    useEffect(() => {
        if (ID) {
            if (conversationMode) {
                previousVersionRef.current = getConversation(ID);
            } else {
                previousVersionRef.current = getMessage(ID);
            }
        } else {
            previousVersionRef.current = undefined;
        }
    }, [ID]);

    useEffect(() => {
        if (!conversationMode) {
            // Not sure why, but message from the selector can be a render late here
            onChange(getMessage(ID || ''));
        }
    }, [message]);

    useEffect(() => {
        if (conversationMode) {
            // Not sure why, but message from the selector can be a render late here
            onChange(getConversation(ID || ''));
        }
    }, [conversation]);

    useEffect(() => {
        if (!ID) {
            return;
        }

        const cacheEntry = conversationMode ? getConversation(ID) : getMessage(ID);

        // Move out of a non existing message
        if (!loading && cacheEntryIsFailedLoading(conversationMode, cacheEntry)) {
            onBack();
        }
    }, [ID, loading]);
};
