import { useState, useEffect, useMemo } from 'react';
import { useApi, useEventManager } from 'react-components';
import { queryConversations, getConversation } from 'proton-shared/lib/api/conversations';
import { queryMessageMetadata, getMessage } from 'proton-shared/lib/api/messages';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { Conversation } from '../models/conversation';
import { toMap } from 'proton-shared/lib/helpers/object';
import { sort as sortElements, hasLabel } from '../helpers/elements';
import { Message } from '../models/message';
import { Element } from '../models/element';
import { Page, Filter, Sort } from '../models/tools';
import { expectedPageLength } from '../helpers/paging';

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
    ConversationCounts?: ElementCountEvent[];
    MessageCounts?: ElementCountEvent[];
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

interface ElementCountEvent {
    LabelID: string;
    Total: number;
    Unread: number;
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
        () => {
            return subscribe(
                async ({ Conversations = [], Messages = [], ConversationCounts = [], MessageCounts = [] }: Event) => {
                    const Elements: ElementEvent[] = conversationMode ? Conversations : Messages;
                    const Counts: ElementCountEvent[] = conversationMode ? ConversationCounts : MessageCounts;

                    const count = Counts.find((count) => count.LabelID === labelID);

                    console.log('event', Elements, count);

                    const { toDelete, toUpdate, toCreate } = Elements.reduce(
                        (acc, event) => {
                            const { ID, Action } = event;
                            const Element = conversationMode
                                ? (event as ConversationEvent).Conversation
                                : (event as MessageEvent).Message;
                            if (Action === EVENT_ACTIONS.DELETE) {
                                acc.toDelete.push(ID);
                            }
                            if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
                                console.warn('Event type UPDATE_DRAFT on Element not supported');
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
                        toUpdate.map(async (element) => {
                            const elementID = element.ID || '';
                            const existingElement = localCache.elements[elementID];

                            return existingElement ? { ...existingElement, ...element } : queryElement(elementID);
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
                            elements: newElements,
                            total: count ? count.Total : localCache.total
                        };
                    });
                }
            );
        },
        // Having the cache in dependency will subscribe / unsubscribe to the eventmanager many times
        // But it's mandatory for the function to have the reference of the current localCache
        [localCache]
    );

    // Reset local cache when needed
    useEffect(() => {
        resetCache();
    }, [labelID, page.size, sort, filter]);
    useEffect(() => {
        if (!isConsecutive(page.page)) {
            resetCache();
        }
    }, [page.page]);

    // Compute the conversations list from the cache
    const elements = useMemo(() => {
        const minPage = localCache.pages.reduce((acc, page) => (page < acc ? page : acc), localCache.pages[0]);
        const startIndex = (page.page - minPage) * page.size;
        const endIndex = startIndex + page.size;
        const elements = Object.values(localCache.elements).filter((element) => hasLabel(element, labelID));
        return sortElements(elements, sort, labelID).slice(startIndex, endIndex);
    }, [localCache, labelID, page.page, page.size]);

    const total = useMemo(() => localCache.total, [localCache.total]);

    // Request data when not in the cache
    useEffect(() => {
        /**
         * Should send request if:
         * - No request currently underway. TODO: What if parameters has changed?
         * - The page is not already in the cache
         * - Or the cache contains the expected count of elements
         * Beware, the total in the page object can't be trusted, it's managed afterwards by the view
         * so the total from the cache has to be used
         */
        const shouldSendRequest = () =>
            !loading &&
            (!localCache.pages.includes(page.page) || elements.length !== expectedPageLength({ ...page, total }));

        const load = async () => {
            setLoading(true);
            try {
                const { Total, Elements } = await queryElements();
                setLocalCache((localCache) => {
                    return {
                        total: Total,
                        pages: [...localCache.pages, page.page],
                        elements: {
                            ...localCache.elements,
                            ...(toMap(Elements, 'ID') as { [ID: string]: Element })
                        }
                    };
                });
            } finally {
                setLoading(false);
            }
        };

        shouldSendRequest() && load();

        // If labelID changes, the cache will be reseted
    }, [localCache, page.page]);

    return [elements, loading, total];
};
