import { useEffect, useRef } from 'react';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import { MessageExtended } from '../models/message';
import { hasLabel } from '../helpers/elements';
import { useMessageCache } from '../containers/MessageProvider';
import { ConversationResult } from './useConversation';
import { useConversationCache } from '../containers/ConversationProvider';

const { ALL_MAIL, TRASH } = MAILBOX_LABEL_IDS;

const cacheEntryHasLabel = (cacheEntry: MessageExtended | ConversationResult | undefined, labelID: string) => {
    const element = (cacheEntry as ConversationResult)?.Conversation || (cacheEntry as MessageExtended)?.data || {};
    return hasLabel(element, labelID);
};

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

    const previousVersionRef = useRef<MessageExtended | ConversationResult | undefined>();
    if (ID) {
        previousVersionRef.current = cache.get(ID);
    } else {
        previousVersionRef.current = undefined;
    }

    useEffect(
        () =>
            cache.subscribe((changedID: string) => {
                if (changedID !== ID) {
                    return;
                }

                const cacheEntry = cache.get(ID);

                // Move out of a deleted element
                if (!cacheEntry) {
                    onBack();
                    return;
                }

                // Move out of trashed message
                const hasLabels = cacheEntryHasLabel(previousVersionRef.current, ALL_MAIL);
                const wasTrashed = cacheEntryHasLabel(previousVersionRef.current, TRASH);
                const isTrashed = cacheEntryHasLabel(cacheEntry, TRASH);
                if (hasLabels && !wasTrashed && isTrashed) {
                    onBack();
                    return;
                }
            }),
        [cache, ID]
    );

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
