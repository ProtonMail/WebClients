import { useState, useEffect, useMemo } from 'react';
import { useApi, useEventManager } from 'react-components';
import { queryConversations, getConversation } from 'proton-shared/lib/api/conversations';
import { queryMessageMetadata, getMessage } from 'proton-shared/lib/api/messages';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { Conversation } from '../models/conversation';
import { toMap } from 'proton-shared/lib/helpers/object';
import { sort as sortElements } from '../helpers/elements';
import { Message } from '../models/message';
import { Element } from '../models/element';
import { Page, Filter, Sort } from '../models/tools';

interface Options {
    conversationMode: boolean;
    labelID: string;
    page: Page;
    sort: Sort;
    filter: Filter;
}

interface Cache {
    total: number;
    pages: number[];
    elements: { [ID: string]: Element };
}

interface Event {
    Conversations?: ConversationEvent[];
    Messages?: MessageEvent[];
}

interface ConversationEvent {
    ID: string;
    Conversation: Conversation;
    Action: EVENT_ACTIONS;
}

interface MessageEvent {
    ID: string;
    Message: Message;
    Action: EVENT_ACTIONS;
}

type ElementEvent = ConversationEvent | MessageEvent;

const emptyCache = (): Cache => ({ elements: {}, pages: [], total: 0 });

export const useElements = ({
    conversationMode,
    labelID,
    page,
    sort,
    filter
}: Options): [Conversation[], boolean, number] => {
    const api = useApi();
    const { subscribe } = useEventManager();
    const [loading, setLoading] = useState(false);
    const [localCache, setLocalCache] = useState<Cache>(emptyCache());

    const isConsecutive = (newPage: number) =>
        localCache.pages.some((page) => page === newPage || page === newPage - 1 || page === newPage + 1);

    // Prevent updating the state when the cache is already empty
    const resetCache = () => {
        if (localCache.pages.length > 0 || Object.values(localCache.elements).length > 0) {
            setLocalCache(emptyCache());
        }
    };

    const queryElement = async (elementID: string): Promise<Element> => {
        const query = conversationMode ? getConversation : getMessage;
        const result = await api(query(elementID));
        return conversationMode ? result.Conversation : result.Message;
    };

    const queryElements = async (): Promise<{ Total: number; Elements: Element[] }> => {
        const query = conversationMode ? queryConversations : queryMessageMetadata;
        const result = await api(
            query({
                Page: page.page,
                PageSize: page.size,
                Limit: page.limit,
                LabelID: labelID,
                Sort: sort.sort,
                Desc: sort.desc ? 1 : 0,
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
                Unread: filter.Unread
                // AddressID,
                // ID,
                // AutoWildcard
            } as any)
        );
        return {
            Total: result.Total,
            Elements: conversationMode ? result.Conversations : result.Messages
        };
    };

    // Listen to event manager and update de cache
    useEffect(
        () =>
            subscribe(async ({ Conversations = [], Messages = [] }: Event) => {
                const Elements: ElementEvent[] = conversationMode ? Conversations : Messages;

                console.log('Event', Elements);

                const { toDelete, toUpdate, toCreate } = Elements.reduce(
                    (acc, event) => {
                        const { ID, Action } = event;
                        const Element = conversationMode
                            ? (event as ConversationEvent).Conversation
                            : (event as MessageEvent).Message;
                        if (Action === EVENT_ACTIONS.DELETE) {
                            acc.toDelete.push(ID);
                        }
                        if (Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                            acc.toUpdate.push({ ID, ...Element });
                        }
                        if (Action === EVENT_ACTIONS.CREATE) {
                            acc.toCreate.push(Element);
                        }
                        return acc;
                    },
                    { toDelete: [] as string[], toUpdate: [] as Element[], toCreate: [] as Element[] }
                );

                const toUpdateCompleted = await Promise.all(
                    toUpdate.map(async (conversation) => {
                        const elementID = conversation.ID || '';
                        const existingConversation = localCache.elements[elementID];

                        return existingConversation
                            ? { ...existingConversation, ...conversation }
                            : queryElement(elementID);
                    })
                );

                setLocalCache((localCache) => {
                    const newReplacements: { [ID: string]: Element } = {};

                    [...toCreate, ...toUpdateCompleted].forEach((element) => {
                        newReplacements[element.ID || ''] = element;
                    });
                    const newElements = {
                        ...localCache.elements,
                        ...newReplacements
                    };
                    toDelete.forEach((elementID) => {
                        delete newElements[elementID];
                    });

                    return {
                        ...localCache,
                        elements: newElements
                    };
                });
            }),
        // Having the cache in dependency will subscribe / unsubscribe to the eventmanager many times
        // But it's mandatory for the function to have the reference of the current localCache
        [localCache]
    );

    // Reset local cache when needed
    useEffect(() => {
        console.log('reset cache');
        resetCache();
    }, [labelID, page.size, sort, filter]);
    useEffect(() => {
        console.log('reset cache consecutive');
        if (!isConsecutive(page.page)) {
            resetCache();
        }
    }, [page.page]);

    // Compute the conversations list from the cache
    const elements = useMemo(() => {
        const minPage = localCache.pages.reduce((acc, page) => (page < acc ? page : acc), localCache.pages[0]);
        const startIndex = (page.page - minPage) * page.size;
        const endIndex = startIndex + page.size;
        const elements = Object.values(localCache.elements).filter(({ LabelIDs = [] }) =>
            LabelIDs.some((ID: string) => ID === labelID)
        );
        return sortElements(elements, sort, labelID).slice(startIndex, endIndex);
    }, [localCache, labelID, page.page, page.size]);

    const total = useMemo(() => localCache.total, [localCache.total]);

    // Request data when not in the cache
    useEffect(() => {
        // No second request if already one underway. TODO: What if parameters has changed?
        // Send request if page not in cache
        const shouldSendRequest = () => {
            // TODO: Check for page size BUT it's complicated
            // - check against page size
            // - check against total responses
            // - check against last page size
            // WARNING: a problem in the check could trigger infinite requests
            return !loading && !localCache.pages.includes(page.page);
        };

        const load = async () => {
            setLoading(true);
            try {
                const { Total, Elements } = await queryElements();
                setLoading(false);
                setLocalCache((localCache) => {
                    return {
                        total: Total,
                        pages: [...localCache.pages, page.page],
                        elements: {
                            ...localCache.elements,
                            ...toMap(Elements, 'ID')
                        }
                    };
                });
            } catch (error) {
                setLoading(false);
            }
        };

        shouldSendRequest() && load();

        // If labelID changes, the cache will be reseted
    }, [localCache, page.page]);

    return [elements, loading, total];
};
