import { useCallback, useEffect, useState } from 'react';
import { wait } from 'proton-shared/lib/helpers/promise';
import { Conversation, ConversationCacheEntry } from '../../models/conversation';
import {
    ConversationCache,
    useConversationCache,
    useUpdateConversationCache,
} from '../../containers/ConversationProvider';
import { useGetElementsFromIDs } from '../mailbox/useElementsCache';
import { LoadConversation, useLoadConversation } from './useLoadConversation';
import { LOAD_RETRY_COUNT, LOAD_RETRY_DELAY } from '../../constants';
import { hasError } from '../../helpers/errors';

const init = (
    conversationID: string,
    cache: ConversationCache,
    getElementsFromIDs: (IDs: string[]) => Conversation[]
): ConversationCacheEntry | undefined => {
    if (cache.has(conversationID)) {
        return cache.get(conversationID) as ConversationCacheEntry;
    }

    const [conversationFromElementsCache] = getElementsFromIDs([conversationID]);

    if (conversationFromElementsCache) {
        return { Conversation: conversationFromElementsCache, Messages: undefined, loadRetry: 0, errors: {} };
    }

    return { Conversation: undefined, Messages: undefined, loadRetry: 0, errors: {} };
};

const load = async (
    conversationID: string,
    messageID: string | undefined,
    cache: ConversationCache,
    setPendingRequest: (value: boolean) => void,
    loadConversation: LoadConversation
) => {
    if ((cache.get(conversationID)?.loadRetry || 0) > LOAD_RETRY_COUNT) {
        // Max retries reach, aborting
        return;
    }

    setPendingRequest(true);
    const entry = await loadConversation(conversationID, messageID);
    if (hasError(entry.errors)) {
        await wait(LOAD_RETRY_DELAY);
    }
    setPendingRequest(false);
};

interface ReturnValue {
    conversationID: string;
    conversation: ConversationCacheEntry | undefined;
    pendingRequest: boolean;
    loadingConversation: boolean;
    loadingMessages: boolean;
    numMessages: number | undefined;
    handleRetry: () => void;
}

interface UseConversation {
    (conversationID: string, messageID?: string): ReturnValue;
}

export const useConversation: UseConversation = (inputConversationID, messageID) => {
    const cache = useConversationCache();
    const getElementsFromIDs = useGetElementsFromIDs();
    const loadConversation = useLoadConversation();
    const updateConversation = useUpdateConversationCache();

    const [conversationID, setConversationID] = useState(inputConversationID);
    const [pendingRequest, setPendingRequest] = useState(false);
    const [conversation, setConversation] = useState<ConversationCacheEntry | undefined>(() =>
        init(conversationID, cache, getElementsFromIDs)
    );

    useEffect(() => {
        if (pendingRequest) {
            return;
        }

        const conversationCacheEntry = init(inputConversationID, cache, getElementsFromIDs);
        setConversationID(inputConversationID);
        setConversation(conversationCacheEntry);

        if (conversationCacheEntry) {
            cache.set(inputConversationID, conversationCacheEntry);
        }

        if (!conversationCacheEntry || !conversationCacheEntry.Messages || !conversationCacheEntry.Messages.length) {
            void load(inputConversationID, messageID, cache, setPendingRequest, loadConversation);
        }

        return cache.subscribe((changedId: string) => {
            if (inputConversationID === changedId) {
                setConversation(cache.get(inputConversationID));
            }
        });
    }, [inputConversationID, messageID, cache, pendingRequest, conversation?.loadRetry]);

    const handleRetry = useCallback(() => {
        updateConversation(conversationID, () => ({ loadRetry: 0, errors: {} }));
    }, [conversationID]);

    const loadingError = hasError(conversation?.errors) && (conversation?.loadRetry || 0) > LOAD_RETRY_COUNT;
    const loadingConversation = !loadingError && !conversation?.Conversation;
    const loadingMessages = !loadingError && !conversation?.Messages?.length;
    const numMessages = conversation?.Messages?.length || conversation?.Conversation?.NumMessages;

    return {
        conversationID,
        conversation,
        pendingRequest,
        loadingConversation,
        loadingMessages,
        numMessages,
        handleRetry,
    };
};
