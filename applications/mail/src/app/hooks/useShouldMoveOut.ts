import { useEffect, useRef } from 'react';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import { MessageExtended } from '../models/message';
import { hasLabel, getCurrentFolderID } from '../helpers/elements';
import { useMessageCache } from '../containers/MessageProvider';
import { ConversationResult } from './useConversation';
import { useConversationCache } from '../containers/ConversationProvider';
import { useFolders } from 'react-components';

const { ALL_MAIL } = MAILBOX_LABEL_IDS;

const chacheEntryToElement = (cacheEntry: MessageExtended | ConversationResult | undefined) =>
    (cacheEntry as ConversationResult)?.Conversation || (cacheEntry as MessageExtended)?.data || {};

const cacheEntryIsFailedLoading = (
    conversationMode: boolean,
    cacheEntry: MessageExtended | ConversationResult | undefined
) => {
    if (conversationMode) {
        return cacheEntry === undefined;
    } else {
        const messageExtended = cacheEntry as MessageExtended;
        return messageExtended?.data?.ID && !messageExtended?.data?.Subject;
    }
};

export const useShouldMoveOut = (
    conversationMode: boolean,
    ID: string | undefined,
    loading: boolean,
    onBack: () => void
) => {
    const messageCache = useMessageCache();
    const conversationCache = useConversationCache();
    const cache = conversationMode ? conversationCache : messageCache;
    const [folders = []] = useFolders();

    const previousVersionRef = useRef<MessageExtended | ConversationResult | undefined>();

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
            const previousElement = chacheEntryToElement(previousVersionRef.current);
            const currentElement = chacheEntryToElement(cacheEntry);
            const hadLabels = hasLabel(previousElement, ALL_MAIL);
            const previousFolderID = getCurrentFolderID(previousElement, folders);
            const currentFolderID = getCurrentFolderID(currentElement, folders);

            if (hadLabels && previousFolderID !== currentFolderID) {
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
            return;
        }
    }, [cache, ID, loading]);
};
