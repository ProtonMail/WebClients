import { useSelector } from 'react-redux';
import { useEffect, useMemo, useRef } from 'react';
import { useFolders } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { MessageExtended } from '../models/message';
import { hasLabel, getCurrentFolderIDs } from '../helpers/elements';
import { getLocalID, useMessageCache } from '../containers/MessageProvider';
import { hasErrorType } from '../helpers/errors';
import { ConversationState } from '../logic/conversations/conversationsTypes';
import { useGetConversation } from './conversation/useConversation';
import { conversationByID } from '../logic/conversations/conversationsSelectors';
import { RootState } from '../logic/store';

const { ALL_MAIL } = MAILBOX_LABEL_IDS;

const cacheEntryToElement = (cacheEntry: MessageExtended | ConversationState | undefined) =>
    (cacheEntry as ConversationState)?.Conversation || (cacheEntry as MessageExtended)?.data || {};

const cacheEntryIsFailedLoading = (
    conversationMode: boolean,
    cacheEntry: MessageExtended | ConversationState | undefined
) => {
    if (conversationMode) {
        return hasErrorType(cacheEntry?.errors, 'notExist');
    }
    const messageExtended = cacheEntry as MessageExtended;
    return messageExtended?.data?.ID && !messageExtended?.data?.Subject;
};

export const useShouldMoveOut = (
    conversationMode: boolean,
    inputID: string | undefined,
    loading: boolean,
    onBack: () => void
) => {
    const messageCache = useMessageCache();
    const getConversation = useGetConversation();
    const [folders = []] = useFolders();

    const previousVersionRef = useRef<MessageExtended | ConversationState | undefined>();

    const ID = useMemo(() => (conversationMode ? inputID : getLocalID(messageCache, inputID || '')), [inputID]);

    const conversation = useSelector((state: RootState) => conversationByID(state, { ID: ID || '' }));

    const onChange = (cacheEntry: MessageExtended | ConversationState | undefined) => {
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
                previousVersionRef.current = messageCache.get(ID);
            }
        } else {
            previousVersionRef.current = undefined;
        }

        return messageCache.subscribe((changedID: string) => {
            if (changedID !== ID) {
                return;
            }

            const cacheEntry = messageCache.get(ID);
            onChange(cacheEntry);
        });
    }, [messageCache, ID]);

    useEffect(() => {
        // If the conversation is not in the state yet, it will move out from it without even loading it
        // We need to check whether it's the first time we click on it to prevent the unwanted move out
        if (conversationMode && previousVersionRef.current !== undefined) {
            onChange(conversation);
        }
    }, [conversation]);

    useEffect(() => {
        if (!ID) {
            return;
        }

        const cacheEntry = conversationMode ? getConversation(ID) : messageCache.get(ID);

        // Move out of a non existing message
        if (!loading && cacheEntryIsFailedLoading(conversationMode, cacheEntry)) {
            onBack();
        }
    }, [messageCache, ID, loading]);
};
