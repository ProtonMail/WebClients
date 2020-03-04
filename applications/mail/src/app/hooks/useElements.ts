import { useState, useEffect, useMemo } from 'react';
import { useApi } from 'react-components';
import { queryConversations, getConversation } from 'proton-shared/lib/api/conversations';
import { queryMessageMetadata, getMessage } from 'proton-shared/lib/api/messages';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';

import { Conversation } from '../models/conversation';
import { sort as sortElements, hasLabel, parseLabelIDsInEvent } from '../helpers/elements';
import { Element } from '../models/element';
import { Page, Filter, Sort, SearchParameters } from '../models/tools';
import { expectedPageLength } from '../helpers/paging';
import {
    ElementEvent,
    Event,
    ElementCountEvent,
    ConversationEvent,
    MessageEvent,
    LabelIDsChanges
} from '../models/event';
import { useSubscribeEventManager } from './useHandler';

interface Options {
    conversationMode: boolean;
    labelID: string;
    page: Page;
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
}

interface CacheParams {
    labelID: string;
    sort: Sort;
    filter: Filter;
    address?: string;
    from?: string;
    to?: string;
    keyword?: string;
    begin?: number;
    end?: number;
    attachments?: number;
    wildcard?: number;
}

interface Cache {
    params: CacheParams;
    page: Page;
    pages: number[];
    elements: { [ID: string]: Element };
}

const emptyCache = (page: Page, params: CacheParams): Cache => ({ params, page, elements: {}, pages: [] });

// /**
//  * Listen to event manager once but allow the handler to be updated in time
//  */
// const useSubscribeEventManager = (handler: (event: any) => void) => {
//     const { subscribe } = useEventManager();
//     const handlerRef = useRef<(event: any) => void>(noop);

//     useEffect(() => {
//         handlerRef.current = handler;
//     }, [handler]);

//     useEffect(() => {
//         const actualHandler = (event: any) => handlerRef.current(event);
//         return subscribe(actualHandler);
//     }, []);
// };

export const useElements = ({
    conversationMode,
    labelID,
    search,
    page,
    sort,
    filter
}: Options): [string, Conversation[], boolean, number] => {
    const api = useApi();
    const [loading, setLoading] = useState(false);
    const [localCache, setLocalCache] = useState<Cache>(
        emptyCache(page, {
            labelID,
            sort,
            filter,
            ...search
        })
    );

    // Compute the conversations list from the cache
    const elements = useMemo(() => {
        // Getting all params from the cache and not from scoped params
        // To prevent any desynchronization between cache and the output of the memo
        const {
            params: { labelID, sort },
            page
        } = localCache;

        const minPage = localCache.pages.reduce((acc, page) => (page < acc ? page : acc), localCache.pages[0]);
        const startIndex = (page.page - minPage) * page.size;
        const endIndex = startIndex + page.size;
        const elementsArray = Object.values(localCache.elements);
        const filtered = elementsArray.filter((element) => hasLabel(element, labelID));
        const sorted = sortElements(filtered, sort, labelID);
        return sorted.slice(startIndex, endIndex);
    }, [localCache]);

    const total = useMemo(() => localCache.page.total, [localCache.page.total]);

    const paramsChanged = () =>
        labelID !== localCache.params.labelID ||
        sort !== localCache.params.sort ||
        filter !== localCache.params.filter ||
        search.address !== localCache.params.address ||
        search.from !== localCache.params.from ||
        search.to !== localCache.params.to ||
        search.keyword !== localCache.params.keyword ||
        search.begin !== localCache.params.begin ||
        search.end !== localCache.params.end ||
        search.attachments !== localCache.params.attachments ||
        search.wildcard !== localCache.params.wildcard;

    const pageCached = () => localCache.pages.includes(page.page);

    const pageChanged = () => localCache.page.page !== page.page;

    const pageIsConsecutive = () =>
        localCache.pages.some((p) => p === page.page || p === page.page - 1 || p === page.page + 1);

    const isExpectedLength = () => elements.length === expectedPageLength({ ...page, total });

    const shouldResetCache = () => !loading && (paramsChanged() || !pageIsConsecutive());

    const shouldSendRequest = () => !loading && (shouldResetCache() || !pageCached() || !isExpectedLength());

    const shouldUpdatePage = () => pageChanged() && pageCached();

    const updatePage = () => {
        setLocalCache({
            ...localCache,
            page: { ...localCache.page, page: page.page }
        });
    };

    const queryElement = async (elementID: string): Promise<Element> => {
        const query = conversationMode ? getConversation : getMessage;
        const result = (await api(query(elementID))) as any;
        return conversationMode ? result.Conversation : result.Message;
    };

    const queryElements = async (): Promise<{ Total: number; Elements: Element[] }> => {
        const query = conversationMode ? queryConversations : queryMessageMetadata;
        const result = (await api(
            query({
                Page: page.page,
                PageSize: page.size,
                Limit: page.limit,
                LabelID: labelID,
                Sort: sort.sort,
                Desc: sort.desc ? 1 : 0,
                Begin: search.begin,
                End: search.end,
                // BeginID,
                // EndID,
                Keyword: search.keyword,
                To: search.to,
                From: search.from,
                // Subject,
                Attachments: search.attachments,
                Unread: filter.Unread,
                AddressID: search.address,
                // ID,
                AutoWildcard: search.wildcard
            } as any)
        )) as any;

        return {
            Total: result.Total,
            Elements: conversationMode ? result.Conversations : result.Messages
        };
    };

    const resetCache = () =>
        setLocalCache(
            emptyCache(page, {
                labelID,
                sort,
                filter,
                ...search
            })
        );

    const load = async () => {
        setLoading(true);
        try {
            const { Total, Elements } = await queryElements();
            setLocalCache(
                (localCache: Cache): Cache => {
                    return {
                        ...localCache,
                        page: {
                            ...localCache.page,
                            page: page.page,
                            total: Total
                        },
                        pages: [...localCache.pages, page.page],
                        elements: {
                            ...localCache.elements,
                            ...(toMap(Elements, 'ID') as { [ID: string]: Element })
                        }
                    };
                }
            );
        } finally {
            setLoading(false);
        }
    };

    // Main effect watching all inputs and responsible to trigger actions on the cache
    useEffect(() => {
        shouldResetCache() && resetCache();
        shouldSendRequest() && load();
        shouldUpdatePage() && updatePage();
    }, [
        labelID,
        page,
        sort,
        filter,
        search.address,
        search.from,
        search.to,
        search.keyword,
        search.begin,
        search.end,
        search.attachments,
        search.wildcard
    ]);

    // Listen to event manager and update de cache
    useSubscribeEventManager(
        async ({ Conversations = [], Messages = [], ConversationCounts = [], MessageCounts = [] }: Event) => {
            const Elements: ElementEvent[] = conversationMode ? Conversations : Messages;
            const Counts: ElementCountEvent[] = conversationMode ? ConversationCounts : MessageCounts;

            const count = Counts.find((count) => count.LabelID === labelID);

            const { toDelete, toUpdate, toCreate } = Elements.reduce(
                (acc, event) => {
                    const { ID, Action } = event;
                    const Element = conversationMode
                        ? (event as ConversationEvent).Conversation
                        : (event as MessageEvent).Message;
                    switch (Action) {
                        case EVENT_ACTIONS.DELETE:
                            acc.toDelete.push(ID);
                            break;
                        case EVENT_ACTIONS.UPDATE_DRAFT:
                        case EVENT_ACTIONS.UPDATE_FLAGS:
                            acc.toUpdate.push({ ID, ...Element });
                            break;
                        case EVENT_ACTIONS.CREATE:
                            acc.toCreate.push(Element);
                            break;
                    }
                    return acc;
                },
                {
                    toDelete: [] as string[],
                    toUpdate: [] as (Element & LabelIDsChanges)[],
                    toCreate: [] as (Element & LabelIDsChanges)[]
                }
            );

            const toUpdateCompleted = await Promise.all(
                toUpdate.map(async (element) => {
                    const elementID = element.ID || '';
                    const existingElement = localCache.elements[elementID];

                    if (existingElement) {
                        element = parseLabelIDsInEvent(existingElement, element);
                    }

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
                    page: {
                        ...localCache.page,
                        total: count ? count.Total : localCache.page.total
                    }
                };
            });
        }
    );

    return [localCache.params.labelID, elements, loading, localCache.page.total];
};
