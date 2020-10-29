import { useEffect, useMemo, useRef } from 'react';
import { useFolders } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import { MessageExtended } from '../models/message';
import { hasLabel, getCurrentFolderID } from '../helpers/elements';
import { getLocalID, useMessageCache } from '../containers/MessageProvider';
import { ConversationResult } from './useConversation';
import { useConversationCache } from '../containers/ConversationProvider';

const { ALL_MAIL } = MAILBOX_LABEL_IDS;

const cacheEntryToElement = (cacheEntry: MessageExtended | ConversationResult | undefined) =>
    (cacheEntry as ConversationResult)?.Conversation || (cacheEntry as MessageExtended)?.data || {};

const cacheEntryIsFailedLoading = (
    conversationMode: boolean,
    cacheEntry: MessageExtended | ConversationResult | undefined
) => {
    if (conversationMode) {
        return cacheEntry === undefined;
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
    const conversationCache = useConversationCache();
    const cache = conversationMode ? conversationCache : messageCache;
    const [folders = []] = useFolders();

    const previousVersionRef = useRef<MessageExtended | ConversationResult | undefined>();

    const ID = useMemo(() => (conversationMode ? inputID : getLocalID(messageCache, inputID || '')), [inputID]);

    useEffect(() => {
        if (ID) {
            previousVersionRef.current = cache.get(ID);
        } else {
            previousVersionRef.current = undefined;
        }

        return cache.subscribe((changedID: string) => {
            if (changedID !== ID) {
                return;
            }

            const cacheEntry = cache.get(ID);

            // Move out of a deleted element
            if (!cacheEntry) {
                onBack();
                return;
            }

            // Move out of moved away message
            const previousElement = cacheEntryToElement(previousVersionRef.current);
            const currentElement = cacheEntryToElement(cacheEntry);
            const hadLabels = hasLabel(previousElement, ALL_MAIL);
            const previousFolderID = getCurrentFolderID(previousElement, folders);
            const currentFolderID = getCurrentFolderID(currentElement, folders);

            if (hadLabels && previousFolderID !== '' && previousFolderID !== currentFolderID) {
                onBack();
                return;
            }

            previousVersionRef.current = cacheEntry;
        });
    }, [cache, ID]);

    useEffect(() => {
        if (!ID) {
            return;
        }

        const cacheEntry = cache.get(ID);

        // Move out of a non existing message
        if (!loading && cacheEntryIsFailedLoading(conversationMode, cacheEntry)) {
            onBack();
        }
    }, [cache, ID, loading]);
};
