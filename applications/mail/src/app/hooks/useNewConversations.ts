import { useState, useEffect, useMemo } from 'react';
import { useApi, useEventManager } from 'react-components';
import { queryConversations, getConversation } from 'proton-shared/lib/api/conversations';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { Conversation } from '../models/conversation';
import { toMap } from 'proton-shared/lib/helpers/object';
import { getTime } from '../helpers/conversation';

interface Options {
    labelID: string;
    pageNumber?: number;
    pageSize?: number;
    filter?: any;
    sort?: any;
}

interface Cache {
    total: number;
    pages: number[];
    conversations: { [ID: string]: Conversation };
}

interface Event {
    Conversations?: ConversationEvent[];
}

interface ConversationEvent {
    ID: string;
    Conversation: Conversation;
    Action: EVENT_ACTIONS;
}

const emptyCache = (): Cache => ({ conversations: {}, pages: [], total: 0 });

export const useConversations = ({
    labelID,
    pageNumber = 0,
    pageSize = 50
}: Options): [Conversation[], boolean, number] => {
    const api = useApi();
    const { subscribe } = useEventManager();
    const [loading, setLoading] = useState(false);
    const [localCache, setLocalCache] = useState<Cache>(emptyCache());

    const isConsecutive = (newPage: number) =>
        localCache.pages.some((page) => page === newPage || page === newPage - 1 || page === newPage + 1);

    // Prevent updating the state when the cache is already empty
    const resetCache = () => {
        if (localCache.pages.length > 0 || Object.values(localCache.conversations).length > 0) {
            console.log('actual reset cache');
            setLocalCache(emptyCache());
        }
    };

    // Listen to event manager and update de cache
    useEffect(
        () =>
            subscribe(async ({ Conversations = [] }: Event) => {
                console.log('Event', Conversations);

                const { toDelete, toUpdate, toCreate } = Conversations.reduce(
                    (acc, { ID, Conversation, Action }) => {
                        if (Action === EVENT_ACTIONS.DELETE) {
                            acc.toDelete.push(ID);
                        }
                        if (Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                            acc.toUpdate.push({ ID, ...Conversation });
                        }
                        if (Action === EVENT_ACTIONS.CREATE) {
                            acc.toCreate.push(Conversation);
                        }
                        return acc;
                    },
                    { toDelete: [] as string[], toUpdate: [] as Conversation[], toCreate: [] as Conversation[] }
                );

                const toUpdateCompleted = await Promise.all(
                    toUpdate.map(async (conversation) => {
                        const conversationID = conversation.ID || '';
                        const existingConversation = localCache.conversations[conversationID];

                        return existingConversation
                            ? { ...existingConversation, ...conversation }
                            : await api(getConversation(conversationID)).then(({ Conversation }: any) => Conversation);
                    })
                );

                setLocalCache((localCache) => {
                    const newReplacements: { [ID: string]: Conversation } = {};

                    [...toCreate, ...toUpdateCompleted].forEach((Conversation) => {
                        newReplacements[Conversation.ID] = Conversation;
                    });
                    const newConversations = {
                        ...localCache.conversations,
                        ...newReplacements
                    };
                    toDelete.forEach((conversationID) => {
                        delete newConversations[conversationID];
                    });

                    return {
                        ...localCache,
                        conversations: newConversations
                    };
                });
            }),
        // Having the cache in dependency will subscribe / unsubscribe to the eventmanager many times
        // But it's mandatory for the function to have the reference of the current localCache
        [localCache]
    );

    // Reset local cache when needed
    useEffect(() => {
        console.log('Reset cache (label or pageSize)');
        resetCache();
    }, [labelID, pageSize]);
    useEffect(() => {
        if (!isConsecutive(pageNumber)) {
            console.log('Reset cache (not consecutive)');
            resetCache();
        }
    }, [pageNumber]);

    // Compute the conversations list from the cache
    const conversations = useMemo(() => {
        const minPage = localCache.pages.reduce((acc, page) => (page < acc ? page : acc), localCache.pages[0]);
        const startIndex = (pageNumber - minPage) * pageSize;
        const endIndex = startIndex + pageSize;
        return Object.values(localCache.conversations)
            .sort((c1, c2) => getTime(c2, labelID) - getTime(c1, labelID))
            .filter(({ Labels = [] }) => Labels.some(({ ID }) => ID === labelID))
            .slice(startIndex, endIndex);
    }, [localCache, labelID, pageNumber, pageSize]);

    const total = useMemo(() => localCache.total, [localCache.total]);

    // Request data when not in the cache
    useEffect(() => {
        // No second request if already one underway. TODO: What if parameters change?
        // Send request if page not in cache
        const shouldSendRequest = () => {
            // TODO: Check for page size BUT it's complicated
            // - check against page size
            // - check against total responses
            // - check against last page size
            // WARNING: a problem in the check could trigger infinite requests
            return !loading && !localCache.pages.includes(pageNumber);
        };

        const load = async () => {
            console.log('Load', 'label', labelID, 'page', pageNumber);
            setLoading(true);
            try {
                const { Total, Conversations } = await api(
                    queryConversations({
                        Page: pageNumber,
                        PageSize: pageSize,
                        // Limit: 100,
                        LabelID: labelID
                        // Sort,
                        // Desc = 1,
                        // Begin,
                        // End,
                        // BeginID,
                        // EndID,
                        // Keyword,
                        // To,
                        // From,
                        // Subject,
                        // Attachments,
                        // Starred,
                        // Unread,
                        // AddressID,
                        // ID,
                        // AutoWildcard
                    } as any)
                );
                setLoading(false);
                setLocalCache((localCache) => ({
                    total: Total,
                    pages: [...localCache.pages, pageNumber],
                    conversations: {
                        ...localCache.conversations,
                        ...toMap(Conversations, 'ID')
                    }
                }));
            } catch (error) {
                setLoading(false);
            }
        };

        shouldSendRequest() && load();

        // If labelID changes, the cache will be reseted
    }, [pageNumber, localCache]);

    return [conversations, loading, total];
};
