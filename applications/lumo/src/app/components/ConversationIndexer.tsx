import { useEffect } from 'react';

import { useUser } from '@proton/account/user/hooks';

import { ENABLE_FOUNDATION_SEARCH } from '../config/search';
import { useLumoSelector, useLumoStore } from '../redux/hooks';
import { selectConversations, selectMasterKeysBundle, selectMessages } from '../redux/selectors';
import { SearchService } from '../services/search/searchService';

/** Quiet time after the last chat change before indexing, so a streamed reply is indexed once. */
const SYNC_DELAY_MS = 2_000;

/**
 * Keeps the encrypted chat search index in step with the user's chats: once they are loaded from
 * IndexedDB, then shortly after any chat or message changes. Only chats that changed are re-indexed.
 */
export const ConversationIndexer = () => {
    const [user] = useUser();
    const userId = user?.ID;
    const store = useLumoStore();
    const reduxLoadedFromIdb = useLumoSelector((state) => state.initialization.reduxLoadedFromIdb);
    const hasMasterKeys = useLumoSelector((state) => !!selectMasterKeysBundle(state));
    const conversations = useLumoSelector(selectConversations);
    const messages = useLumoSelector(selectMessages);

    useEffect(() => {
        if (!ENABLE_FOUNDATION_SEARCH || !userId || !reduxLoadedFromIdb || !hasMasterKeys) {
            return;
        }
        const timer = setTimeout(() => {
            SearchService.get(userId)
                .syncConversations(() => {
                    const state = store.getState();
                    return { conversations: selectConversations(state), messages: selectMessages(state) };
                })
                .catch((error) => console.warn('[ConversationIndexer] Indexing chats failed', error));
        }, SYNC_DELAY_MS);
        return () => clearTimeout(timer);
    }, [userId, store, reduxLoadedFromIdb, hasMasterKeys, conversations, messages]);

    return null;
};
