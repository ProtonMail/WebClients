import { useEffect, useMemo, useRef } from 'react';
import { c } from 'ttag';
import {
    useApi,
    useCache,
    useConversationCounts,
    useMessageCounts,
    useNotifications,
    useSubscribeEventManager,
} from 'react-components';
import { queryConversations, getConversation } from 'proton-shared/lib/api/conversations';
import { queryMessageMetadata, getMessage } from 'proton-shared/lib/api/messages';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { toMap, omit } from 'proton-shared/lib/helpers/object';
import { ConversationCountsModel, MessageCountsModel } from 'proton-shared/lib/models';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import { noop } from 'proton-shared/lib/helpers/function';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { STATUS } from 'proton-shared/lib/models/cache';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { captureMessage } from 'proton-shared/lib/helpers/sentry';
import {
    sort as sortElements,
    hasLabel,
    parseLabelIDsInEvent,
    isSearch,
    isFilter,
    isUnread,
} from '../../helpers/elements';
import { Element } from '../../models/element';
import { Filter, Sort, SearchParameters } from '../../models/tools';
import { expectedPageLength, pageCount } from '../../helpers/paging';
import { ElementEvent, Event, ConversationEvent, MessageEvent, LabelIDsChanges } from '../../models/event';
import { useExpirationCheck } from '../useExpiration';
import {
    ElementsCache,
    ElementsCacheParams,
    RetryData,
    useElementsCache,
    useSetElementsCache,
} from './useElementsCache';
import {
    ELEMENTS_CACHE_REQUEST_SIZE,
    PAGE_SIZE,
    DEFAULT_PLACEHOLDERS_COUNT,
    MAX_ELEMENT_LIST_LOAD_RETRIES,
} from '../../constants';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

interface Options {
    conversationMode: boolean;
    labelID: string;
    page: number;
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
    onPage: (page: number) => void;
}

interface ReturnValue {
    labelID: string;
    elements: Element[];
    placeholderCount: number;
    pendingRequest: boolean;
    loading: boolean;
    total: number;
}

interface UseElements {
    (options: Options): ReturnValue;
}

const getTotal = (counts: LabelCount[], labelID: string, filter: Filter) => {
    const count = counts.find((count) => count.LabelID === labelID);

    if (!count) {
        return 0;
    }

    const unreadFilter = filter.Unread as number | undefined;

    if (unreadFilter === undefined) {
        return count.Total || 0;
    }
    if (unreadFilter > 0) {
        return count.Unread || 0;
    }
    return (count.Total || 0) - (count.Unread || 0);
};

const emptyCache = (
    page: number,
    params: ElementsCacheParams,
    retry: RetryData = { payload: null, count: 0, error: undefined },
    beforeFirstLoad: boolean = true
): ElementsCache => {
    return {
        beforeFirstLoad,
        invalidated: false,
        pendingRequest: false,
        params,
        page,
        total: 0,
        elements: {},
        pages: [],
        updatedElements: [],
        bypassFilter: [],
        retry,
    };
};

export const useElements: UseElements = ({ conversationMode, labelID, search, page, sort, filter, onPage }) => {
    const api = useApi();
    const abortControllerRef = useRef<AbortController>();

    const [conversationCounts = [], loadingConversationCounts] = useConversationCounts() as [
        LabelCount[],
        boolean,
        Error
    ];
    const [messageCounts = [], loadingMessageCounts] = useMessageCounts() as [LabelCount[], boolean, Error];
    const counts = conversationMode ? conversationCounts : messageCounts;
    const loadingCounts = conversationMode ? loadingConversationCounts : loadingMessageCounts;

    const { getESDBStatus, encryptedSearch } = useEncryptedSearchContext();
    const { dbExists, esEnabled } = getESDBStatus();
    const { createNotification } = useNotifications();

    const cache = useElementsCache(emptyCache(page, { labelID, sort, filter, esEnabled, ...search }));
    const setCache = useSetElementsCache();

    // Warning: this hook relies mainly on the elementsCache, not the globalCache
    // This import is needed only for specifics use case (message expiration, counters manipulation)
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
            page,
        } = cache;

        const minPage = cache.pages.reduce((acc, page) => (page < acc ? page : acc), cache.pages[0]);
        const startIndex = (page - minPage) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const elementsArray = Object.values(cache.elements);
        const filtered = elementsArray
            .filter((element) => hasLabel(element, labelID))
            .filter((element) => {
                if (!isFilter(filter)) {
                    return true;
                }
                if (cache.bypassFilter.includes(element.ID || '')) {
                    return true;
                }
                const elementUnread = isUnread(element, labelID);
                return filter.Unread ? elementUnread : !elementUnread;
            });
        const sorted = sortElements(filtered, sort, labelID);

        return sorted.slice(startIndex, endIndex);
    }, [cache]);

    // Define if we can base our calculations base on the counters or not
    const baseOnCounters = useMemo(() => !isSearch(cache.params) && !loadingCounts, [cache.params, loadingCounts]);

    // Define if we can expect the result count or not
    const expectingLength = useMemo(
        () => !cache.beforeFirstLoad || baseOnCounters,
        [cache.beforeFirstLoad, baseOnCounters]
    );

    const total = useMemo(() => {
        if (!baseOnCounters) {
            return cache.total;
        }
        return getTotal(counts, cache.params.labelID, cache.params.filter);
    }, [counts, cache.params, cache.total, cache.pendingRequest, expectingLength]);

    const expectedLength = useMemo(() => {
        return expectedPageLength(cache.page, total, isFilter(cache.params.filter) ? cache.bypassFilter.length : 0);
    }, [cache.page, cache.params, total, cache.bypassFilter, cache.pendingRequest]);

    const placeholderCount = useMemo(() => {
        if (!expectingLength) {
            return DEFAULT_PLACEHOLDERS_COUNT;
        }
        return expectedLength;
    }, [expectingLength, expectedLength]);

    const expectedLengthMismatch = useMemo(() => {
        if (!expectingLength) {
            return 0;
        }
        return Math.abs(elements.length - expectedLength);
    }, [elements.length, expectedLength, expectingLength]);

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
        search.wildcard !== cache.params.wildcard ||
        esEnabled !== cache.params.esEnabled;

    const pageCached = () => cache.pages.includes(page);

    const pageChanged = () => cache.page !== page;

    const pageIsConsecutive = () =>
        cache.pages.length === 0 || cache.pages.some((p) => p === page || p === page - 1 || p === page + 1);

    const hasListFromTheStart = () => cache.pages.includes(0);

    const lastHasBeenUpdated = () =>
        elements.length === PAGE_SIZE &&
        page === Math.max.apply(null, cache.pages) &&
        cache.updatedElements.includes(elements[elements.length - 1].ID || '');

    // Live cache means we listen to events from event manager without refreshing the list every time
    const isLiveCache = () => !isSearch(search) && hasListFromTheStart();

    const shouldResetCache = () => paramsChanged() || !pageIsConsecutive() || lastHasBeenUpdated();

    const shouldSendRequest = () =>
        shouldResetCache() ||
        (!cache.pendingRequest &&
            cache.retry.count < MAX_ELEMENT_LIST_LOAD_RETRIES &&
            (cache.invalidated || (expectingLength && expectedLengthMismatch !== 0) || !pageCached()));

    const shouldUpdatePage = () => pageChanged() && pageCached();

    const updatePage = () => {
        setCache({ ...cache, page });
    };

    const queryElement = async (elementID: string): Promise<Element> => {
        const query = conversationMode ? getConversation : getMessage;
        const result: any = await api({ ...query(elementID), silence: true });
        return conversationMode ? result.Conversation : result.Message;
    };

    const getQueryElementsParameters = (): any => ({
        Page: page,
        PageSize: PAGE_SIZE,
        Limit: ELEMENTS_CACHE_REQUEST_SIZE,
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
        AutoWildcard: search.wildcard,
    });

    const queryElements = async (payload: any): Promise<{ Total: number; Elements: Element[] }> => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        const query = conversationMode ? queryConversations : queryMessageMetadata;

        const result: any = await api({ ...query(payload), signal: abortControllerRef.current.signal });

        return {
            Total: result.Total,
            Elements: conversationMode ? result.Conversations : result.Messages,
        };
    };

    /**
     * A retry is the same request as before expecting a different result
     * @param payload: request params + expected total
     * @param error: optional error from last request
     */
    const newRetry = (payload: any, error: Error | undefined) => {
        const count = isDeepEqual(payload, cache.retry.payload) ? cache.retry.count + 1 : 1;
        return { payload, count, error };
    };

    const resetCache = (retry?: RetryData, beforeFirstLoad?: boolean) =>
        setCache(emptyCache(page, { labelID, sort, filter, esEnabled, ...search }, retry, beforeFirstLoad));

    const load = async () => {
        setCache((cache) => ({ ...cache, pendingRequest: true, page }));
        const queryParameters = getQueryElementsParameters();
        try {
            const { Total, Elements } = await queryElements(queryParameters);
            const elementsMap = toMap(Elements, 'ID');
            const updatedElements = cache.updatedElements.filter((elementID) => !elementsMap[elementID]);
            const expectedTotal = getTotal(counts, labelID, filter);

            // Sanity check that the query result total match the expected one
            // If not, we completely refresh the counters
            if (baseOnCounters && Total !== expectedTotal) {
                const countModel = conversationMode ? ConversationCountsModel : MessageCountsModel;
                const value = await countModel.get(api);
                globalCache.set(countModel.key, { status: STATUS.RESOLVED, value });
            }

            setCache((cache) => {
                return {
                    beforeFirstLoad: false,
                    invalidated: false,
                    pendingRequest: false,
                    params: cache.params,
                    page,
                    pages: [...cache.pages, page],
                    total: Total,
                    elements: {
                        ...cache.elements,
                        ...elementsMap,
                    },
                    updatedElements,
                    bypassFilter: cache.bypassFilter,
                    retry: newRetry({ ...queryParameters, expectedTotal }, undefined),
                };
            });
        } catch (error) {
            // Wait a couple of seconds before retrying
            setTimeout(() => {
                setCache((cache) => ({
                    ...cache,
                    beforeFirstLoad: false,
                    invalidated: false,
                    pendingRequest: false,
                    retry: newRetry({ ...queryParameters, total }, error),
                }));
            }, 2000);
        }
    };

    const setEncryptedSearchResults = (Elements: Element[]) => {
        const Total = Elements.length;
        const pages = [0];
        for (let page = 1; page < Math.ceil(Total / PAGE_SIZE); page++) {
            pages.push(page);
        }
        // Retry is disabled for encrypted search results, to avoid re-triggering the search several times
        // when there are no results
        setCache((cache) => {
            return {
                ...cache,
                beforeFirstLoad: false,
                invalidated: false,
                pendingRequest: false,
                page,
                total: Total,
                pages,
                elements: toMap(Elements, 'ID'),
                updatedElements: [],
                retry: { payload: undefined, count: MAX_ELEMENT_LIST_LOAD_RETRIES, error: undefined },
            };
        });
    };

    const executeSearch = async () => {
        setCache((cache) => ({ ...cache, pendingRequest: true }));
        try {
            const success = await encryptedSearch(search, labelID, setEncryptedSearchResults);
            if (!success) {
                if (page >= 200) {
                    // This block will most likely be called two times
                    // Fortunately notification system use a de-duplication system
                    createNotification({
                        text: c('Error')
                            .t`Your search matched too many results. Please limit your search and try again`,
                        type: 'error',
                    });
                    setCache((cache) => ({ ...cache, pendingRequest: false }));
                    onPage(0);
                } else {
                    await load();
                }
            }
        } catch (error) {
            createNotification({
                text: c('Error').t`There has been an issue with content search. Default search has been used instead`,
                type: 'error',
            });
            await load();
        }
    };

    // Main effect watching all inputs and responsible to trigger actions on the cache
    useEffect(() => {
        if (shouldResetCache()) {
            resetCache();
        }
        if (shouldSendRequest()) {
            if (isSearch(search)) {
                void executeSearch();
            } else {
                void load();
            }
        }
        if (shouldUpdatePage()) {
            updatePage();
        }
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
        // These 2 cache values will trigger the effect for any event containing something
        // which could lead to consider refreshing the list
        cache.invalidated,
        cache.updatedElements,
        cache.pendingRequest,
        esEnabled && isSearch(search),
    ]);

    // Move to the last page if the current one becomes empty
    useEffect(() => {
        if (expectingLength && expectedLength === 0 && page > 0) {
            const count = pageCount(total);
            if (count === 0 && page !== 0) {
                onPage(0);
            } else if (page !== count - 1) {
                onPage(count - 1);
            }
        }
    }, [expectingLength, expectedLength, page]);

    useEffect(() => {
        if (
            !cache.beforeFirstLoad &&
            !cache.pendingRequest &&
            cache.retry.error === undefined &&
            expectingLength &&
            elements.length !== expectedLength
        ) {
            if (!esEnabled) {
                const message = 'Elements list inconsistency error';
                const context = {
                    conversationMode,
                    labelID,
                    search,
                    page,
                    sort,
                    filter,
                    total,
                    expectedLength,
                    cache: omit(cache, ['elements']),
                    ...cache.elements, // Sentry limit depth in extra data, this optimize our feedback
                };
                captureMessage(message, { extra: { context } });
                console.error(message, context);
            }
            resetCache(cache.retry, !esEnabled && isSearch(search));
        }
    }, [cache.pendingRequest]);

    // Listen to event manager and update de cache
    useSubscribeEventManager(
        async ({ Conversations = [], Messages = [], ConversationCounts = [], MessageCounts = [] }: Event) => {
            const Elements: ElementEvent[] = conversationMode ? Conversations : Messages;
            const Counts: LabelCount[] = conversationMode ? ConversationCounts : MessageCounts;

            // If it's an encrypted search, its event manager will deal with the change
            if (dbExists && esEnabled && isSearch(search)) {
                return;
            }

            if (!Elements.length && !Counts.length) {
                return;
            }

            if (!isLiveCache()) {
                if (Elements.length) {
                    setCache((cache) => ({ ...cache, invalidated: true }));
                }
                return;
            }

            const total = isSearch(search) ? cache.total : getTotal(Counts, labelID, filter);

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
                        toCreate.push(Element as Element);
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
                    toUpdate
                        .filter(({ ID = '' }) => !toDelete.includes(ID)) // No need to get deleted element
                        .map(async (element) => {
                            const elementID = element.ID || '';
                            const existingElement = cache.elements[elementID];

                            if (existingElement) {
                                element = parseLabelIDsInEvent(existingElement, element);
                            }

                            return existingElement
                                ? { ...existingElement, ...element }
                                : queryElement(elementID).catch(noop);
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
                    ...newReplacements,
                };
                toDelete.forEach((elementID) => {
                    delete newElements[elementID];
                });

                const updatedElements = [...cache.updatedElements, ...Object.keys(newReplacements), ...toDelete];

                return {
                    ...cache,
                    elements: newElements,
                    total,
                    updatedElements,
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
        placeholderCount,
        pendingRequest: cache.pendingRequest,
        loading,
        total: cache.total,
    };
};
