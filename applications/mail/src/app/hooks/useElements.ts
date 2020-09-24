import { useEffect, useMemo, useRef } from 'react';
import { useApi, useCache, useConversationCounts, useMessageCounts, useSubscribeEventManager } from 'react-components';
import { queryConversations, getConversation } from 'proton-shared/lib/api/conversations';
import { queryMessageMetadata, getMessage } from 'proton-shared/lib/api/messages';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';
import { ConversationCountsModel, MessageCountsModel } from 'proton-shared/lib/models';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';

import {
    sort as sortElements,
    hasLabel,
    parseLabelIDsInEvent,
    isSearch,
    isFilter,
    isUnread
} from '../helpers/elements';
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
import { useExpirationCheck } from './useExpiration';
import { ElementsCache, ElementsCacheParams, useElementsCache, useSetElementsCache } from './useElementsCache';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

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

const emptyCache = (page: Page, labelID: string, counts: LabelCount[], params: ElementsCacheParams): ElementsCache => {
    const total = counts.find((count) => count.LabelID === labelID)?.Total || 0;

    return {
        beforeFirstLoad: true,
        invalidated: false,
        pendingRequest: false,
        params,
        page: { ...page, total },
        elements: {},
        pages: [],
        updatedElements: []
    };
};

export const useElements: UseElements = ({ conversationMode, labelID, search, page, sort, filter }) => {
    const api = useApi();
    const abortControllerRef = useRef<AbortController>();

    const [conversationCounts = []] = useConversationCounts() as [LabelCount[], boolean, Error];
    const [messageCounts = []] = useMessageCounts() as [LabelCount[], boolean, Error];
    const counts = conversationMode ? conversationCounts : messageCounts;

    const cache = useElementsCache(
        emptyCache(page, labelID, counts, {
            labelID,
            sort,
            filter,
            ...search
        })
    );
    const setCache = useSetElementsCache();

    // Warning: this hook relies mainly on a localCache, not the globalCache
    // This import is needed only for a specific use case (message expiration)
    const globalCache = useCache();

    // Remove from cache expired elements
    useExpirationCheck(Object.values(cache.elements), (element) => {
        const elements = Object.keys(cache.elements).reduce<{ [ID: string]: Element }>((acc, cacheID) => {
            if (element.ID !== cacheID) {
                acc[cacheID] = cache.elements[cacheID];
            }
            return acc;
        }, {});

        setCache({ ...cache, elements });

        globalCache.delete(ConversationCountsModel.key);
        globalCache.delete(MessageCountsModel.key);
    });

    // Compute the conversations list from the cache
    const elements = useMemo(() => {
        // Getting all params from the cache and not from scoped params
        // To prevent any desynchronization between cache and the output of the memo
        const {
            params: { labelID, sort, filter },
            page
        } = cache;

        const minPage = cache.pages.reduce((acc, page) => (page < acc ? page : acc), cache.pages[0]);
        const startIndex = (page.page - minPage) * page.size;
        const endIndex = startIndex + page.size;
        const elementsArray = Object.values(cache.elements);
        const filtered = elementsArray
            .filter((element) => hasLabel(element, labelID))
            .filter((element) => {
                if (!isFilter(filter)) {
                    return true;
                }
                const elementUnread = isUnread(element, labelID);
                return filter.Unread ? elementUnread : !elementUnread;
            });
        const sorted = sortElements(filtered, sort, labelID);
        return sorted.slice(startIndex, endIndex);
    }, [cache]);

    const expectedLength = useMemo(() => expectedPageLength(cache.page), [cache.page]);
    const expectedLengthMismatch = useMemo(() => Math.abs(elements.length - expectedLength), [
        elements.length,
        expectedLength
    ]);

    const paramsChanged = () =>
        labelID !== cache.params.labelID ||
        sort !== cache.params.sort ||
        filter !== cache.params.filter ||
        search.address !== cache.params.address ||
        search.from !== cache.params.from ||
        search.to !== cache.params.to ||
        search.keyword !== cache.params.keyword ||
        search.begin !== cache.params.begin ||
        search.end !== cache.params.end ||
        search.attachments !== cache.params.attachments ||
        search.wildcard !== cache.params.wildcard;

    const pageCached = () => cache.pages.includes(page.page);

    const pageChanged = () => cache.page.page !== page.page;

    const pageIsConsecutive = () =>
        cache.pages.length === 0 ||
        cache.pages.some((p) => p === page.page || p === page.page - 1 || p === page.page + 1);

    const hasListFromTheStart = () => cache.pages.includes(0);

    const lastHasBeenUpdated = () =>
        elements.length === page.size &&
        page.page === Math.max.apply(null, cache.pages) &&
        cache.updatedElements.includes(elements[elements.length - 1].ID || '');

    // Live cache means we listen to events from event manager without refreshing the list every time
    const isLiveCache = () => !isSearch(search) && hasListFromTheStart();

    const shouldResetCache = () => paramsChanged() || !pageIsConsecutive() || lastHasBeenUpdated();

    const shouldSendRequest = () =>
        shouldResetCache() ||
        (!cache.pendingRequest && (cache.invalidated || expectedLengthMismatch > 0 || !pageCached()));

    const shouldUpdatePage = () => pageChanged() && pageCached();

    const updatePage = () => {
        setCache({
            ...cache,
            page: { ...cache.page, page: page.page }
        });
    };

    const queryElement = async (elementID: string): Promise<Element> => {
        const query = conversationMode ? getConversation : getMessage;
        const result: any = await api(query(elementID));
        return conversationMode ? result.Conversation : result.Message;
    };

    const queryElements = async (): Promise<{ Total: number; Elements: Element[] }> => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        const query = conversationMode ? queryConversations : queryMessageMetadata;
        const result: any = await api({
            ...query({
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
            } as any),
            signal: abortControllerRef.current.signal
        });

        return {
            Total: result.Total,
            Elements: conversationMode ? result.Conversations : result.Messages
        };
    };

    const resetCache = () =>
        setCache(
            emptyCache(page, labelID, counts, {
                labelID,
                sort,
                filter,
                ...search
            })
        );

    const load = async () => {
        setCache((cache) => ({ ...cache, pendingRequest: true }));
        try {
            const { Total, Elements } = await queryElements();
            const elementsMap = toMap(Elements, 'ID');
            const updatedElements = cache.updatedElements.filter((elementID) => !elementsMap[elementID]);
            setCache((cache) => {
                return {
                    beforeFirstLoad: false,
                    invalidated: false,
                    pendingRequest: false,
                    params: cache.params,
                    page: {
                        ...cache.page,
                        page: page.page,
                        total: Total
                    },
                    pages: [...cache.pages, page.page],
                    elements: {
                        ...cache.elements,
                        ...elementsMap
                    },
                    updatedElements
                };
            });
        } catch {
            setCache((cache) => ({ ...cache, beforeFirstLoad: false, invalidated: false, pendingRequest: true }));
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
        search.wildcard,
        cache.invalidated,
        cache.updatedElements
    ]);

    // Listen to event manager and update de cache
    useSubscribeEventManager(
        async ({ Conversations = [], Messages = [], ConversationCounts = [], MessageCounts = [] }: Event) => {
            const Elements: ElementEvent[] = conversationMode ? Conversations : Messages;
            const Counts: ElementCountEvent[] = conversationMode ? ConversationCounts : MessageCounts;

            if (!Elements.length && !Counts.length) {
                return;
            }

            if (!isLiveCache()) {
                if (Elements.length) {
                    setCache((cache) => ({ ...cache, invalidated: true }));
                }
                return;
            }

            const count = Counts.find((count) => count.LabelID === labelID);

            const { toCreate, toUpdate, toDelete } = Elements.reduce<{
                toCreate: (Element & LabelIDsChanges)[];
                toUpdate: (Element & LabelIDsChanges)[];
                toDelete: string[];
            }>(
                ({ toCreate, toUpdate, toDelete }, event) => {
                    const { ID, Action } = event;
                    const Element = conversationMode
                        ? (event as ConversationEvent).Conversation
                        : (event as MessageEvent).Message;

                    if (Action === EVENT_ACTIONS.CREATE) {
                        toCreate.push(Element);
                    } else if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                        toUpdate.push({ ID, ...Element });
                    } else if (Action === EVENT_ACTIONS.DELETE) {
                        toDelete.push(ID);
                    }

                    return { toCreate, toUpdate, toDelete };
                },
                { toCreate: [], toUpdate: [], toDelete: [] }
            );

            const toUpdateCompleted = (
                await Promise.all(
                    toUpdate.map(async (element) => {
                        const elementID = element.ID || '';
                        const existingElement = cache.elements[elementID];

                        if (existingElement) {
                            element = parseLabelIDsInEvent(existingElement, element);
                        }

                        return existingElement ? { ...existingElement, ...element } : queryElement(elementID);
                    })
                )
            ).filter(isTruthy);

            setCache((cache) => {
                const newReplacements: { [ID: string]: Element } = {};

                [...toCreate, ...toUpdateCompleted].forEach((element) => {
                    newReplacements[element.ID || ''] = element;
                });
                const newElements = {
                    ...cache.elements,
                    ...newReplacements
                };
                toDelete.forEach((elementID) => {
                    delete newElements[elementID];
                });

                const updatedElements = [...cache.updatedElements, ...Object.keys(newReplacements), ...toDelete];

                return {
                    ...cache,
                    elements: newElements,
                    page: {
                        ...cache.page,
                        total: count ? count.Total : cache.page.total
                    },
                    updatedElements
                };
            });
        }
    );

    const bigMismatch = expectedLengthMismatch * 2 > expectedLength;
    const smallMismatch = expectedLengthMismatch > 0 && !bigMismatch;
    const loading =
        (cache.beforeFirstLoad || cache.pendingRequest || bigMismatch) && !cache.invalidated && !smallMismatch;

    return {
        labelID: cache.params.labelID,
        elements,
        expectedLength,
        pendingRequest: cache.pendingRequest,
        loading,
        total: cache.page.total
    };
};
