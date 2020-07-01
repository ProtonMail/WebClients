import { useState, useEffect, useMemo } from 'react';
import { useApi, useCache, useConversationCounts, useMessageCounts } from 'react-components';
import { queryConversations, getConversation } from 'proton-shared/lib/api/conversations';
import { queryMessageMetadata, getMessage } from 'proton-shared/lib/api/messages';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';
import { ConversationCountsModel, MessageCountsModel } from 'proton-shared/lib/models';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';

import { sort as sortElements, hasLabel, parseLabelIDsInEvent, isSearch, isFilter } from '../helpers/elements';
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
import { useExpirationCheck } from './useExpiration';

interface Options {
    conversationMode: boolean;
    labelID: string;
    page: Page;
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
}

interface ReturnValue {
    labelID: string;
    elements: Element[];
    expectedLength: number;
    pendingRequest: boolean;
    loading: boolean;
    total: number;
}

interface UseElements {
    (options: Options): ReturnValue;
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
    updatedElements: string[];
}

const emptyCache = (page: Page, labelID: string, counts: LabelCount[], params: CacheParams): Cache => {
    const total = counts.find((count) => count.LabelID === labelID)?.Total || 0;

    return {
        params,
        page: { ...page, total },
        elements: {},
        pages: [],
        updatedElements: []
    };
};

export const useElements: UseElements = ({ conversationMode, labelID, search, page, sort, filter }) => {
    const api = useApi();
    const [loading, setLoading] = useState(false);
    const [invalidated, setInvalidated] = useState(false);
    const [beforeFirstLoad, setBeforeFirstLoad] = useState(true);
    const [conversationCounts = []] = useConversationCounts() as [LabelCount[], boolean, Error];
    const [messageCounts = []] = useMessageCounts() as [LabelCount[], boolean, Error];
    const counts = conversationMode ? conversationCounts : messageCounts;
    const [localCache, setLocalCache] = useState<Cache>(
        emptyCache(page, labelID, counts, {
            labelID,
            sort,
            filter,
            ...search
        })
    );
    // Warning: this hook relies mainly on a localCache, not the globalCache
    // This import is needed only for a specific use case (message expiration)
    const globalCache = useCache();

    // Remove from cache expired elements
    useExpirationCheck(Object.values(localCache.elements), (element) => {
        const elements = Object.keys(localCache.elements).reduce<{ [ID: string]: Element }>((acc, cacheID) => {
            if (element.ID !== cacheID) {
                acc[cacheID] = localCache.elements[cacheID];
            }
            return acc;
        }, {});

        setLocalCache({ ...localCache, elements });

        globalCache.delete(ConversationCountsModel.key);
        globalCache.delete(MessageCountsModel.key);
    });

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

    const expectedLength = useMemo(() => expectedPageLength(localCache.page), [localCache.page]);

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

    const hasListFromTheStart = () => localCache.pages.includes(0);

    const lastHasBeenUpdated = () =>
        elements.length === page.size &&
        page.page === Math.max.apply(null, localCache.pages) &&
        localCache.updatedElements.includes(elements[elements.length - 1].ID || '');

    // Live cache means we listen to events from event manager without refreshing the list every time
    const isLiveCache = () => !isSearch(search) && !isFilter(filter) && hasListFromTheStart();

    const shouldResetCache = () => !loading && (paramsChanged() || !pageIsConsecutive() || lastHasBeenUpdated());

    const shouldSendRequest = () => !loading && (invalidated || shouldResetCache() || !pageCached());

    const shouldUpdatePage = () => pageChanged() && pageCached();

    const updatePage = () => {
        setLocalCache({
            ...localCache,
            page: { ...localCache.page, page: page.page }
        });
    };

    const queryElement = async (elementID: string): Promise<Element> => {
        const query = conversationMode ? getConversation : getMessage;
        const result: any = await api(query(elementID));
        return conversationMode ? result.Conversation : result.Message;
    };

    const queryElements = async (): Promise<{ Total: number; Elements: Element[] }> => {
        const query = conversationMode ? queryConversations : queryMessageMetadata;
        const result: any = await api(
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
        );

        return {
            Total: result.Total,
            Elements: conversationMode ? result.Conversations : result.Messages
        };
    };

    const resetCache = () =>
        setLocalCache(
            emptyCache(page, labelID, counts, {
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
            const elementsMap = toMap(Elements, 'ID');
            const updatedElements = localCache.updatedElements.filter((elementID) => !elementsMap[elementID]);
            setLocalCache(
                (localCache: Cache): Cache => {
                    return {
                        params: localCache.params,
                        page: {
                            ...localCache.page,
                            page: page.page,
                            total: Total
                        },
                        pages: [...localCache.pages, page.page],
                        elements: {
                            ...localCache.elements,
                            ...elementsMap
                        },
                        updatedElements
                    };
                }
            );
        } finally {
            setLoading(false);
            setInvalidated(false);
        }
    };

    // Main effect watching all inputs and responsible to trigger actions on the cache
    useEffect(() => {
        shouldResetCache() && resetCache();
        shouldSendRequest() && load();
        shouldUpdatePage() && updatePage();
        setBeforeFirstLoad(false);
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
        search.wildcard,
        invalidated,
        localCache.updatedElements
    ]);

    // Watch for expected length and invalidate the list if wrong
    useEffect(() => {
        if (elements.length !== 0 && elements.length !== expectedLength) {
            setInvalidated(elements.length !== expectedLength);
        }
    }, [elements.length, expectedLength]);

    // Listen to event manager and update de cache
    useSubscribeEventManager(
        async ({ Conversations = [], Messages = [], ConversationCounts = [], MessageCounts = [] }: Event) => {
            const Elements: ElementEvent[] = conversationMode ? Conversations : Messages;
            const Counts: ElementCountEvent[] = conversationMode ? ConversationCounts : MessageCounts;

            if (!isLiveCache()) {
                if (Elements.length) {
                    setInvalidated(true);
                }
                return;
            }

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

                const updatedElements = [...localCache.updatedElements, ...Object.keys(newReplacements), ...toDelete];

                return {
                    ...localCache,
                    elements: newElements,
                    page: {
                        ...localCache.page,
                        total: count ? count.Total : localCache.page.total
                    },
                    updatedElements
                };
            });
        }
    );

    return {
        labelID: localCache.params.labelID,
        elements,
        expectedLength,
        pendingRequest: loading,
        loading: (beforeFirstLoad || loading) && !invalidated,
        total: localCache.page.total
    };
};
