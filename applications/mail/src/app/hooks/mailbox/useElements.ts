import { useEffect, useMemo, useRef } from 'react';
import { c } from 'ttag';
import {
    useApi,
    useCache,
    useConversationCounts,
    useMessageCounts,
    useNotifications,
    useSubscribeEventManager,
} from '@proton/components';
import { queryConversations, getConversation } from '@proton/shared/lib/api/conversations';
import { queryMessageMetadata, getMessage } from '@proton/shared/lib/api/messages';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { toMap, omit } from '@proton/shared/lib/helpers/object';
import { range } from '@proton/shared/lib/helpers/array';
import { ConversationCountsModel, MessageCountsModel } from '@proton/shared/lib/models';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import { noop } from '@proton/shared/lib/helpers/function';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
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
import { ESSetsElementsCache } from '../../models/encryptedSearch';

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
    loading: boolean;
    total: number | undefined;
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
        total: undefined,
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

    const { getESDBStatus, encryptedSearch, incrementSearch } = useEncryptedSearchContext();
    const { dbExists, esEnabled, isCacheLimited, isSearchPartial } = getESDBStatus();
    const { createNotification } = useNotifications();
    const useES = dbExists && esEnabled && isSearch(search) && (!!search.keyword || !isCacheLimited);

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

        setCache((cache) => ({ ...cache, elements }));

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

    /**
     * Computed up to date total of elements for the current parameters
     * Warning: this value has been proved not to be 100% consistent
     * Has to be used only for non sensitive behaviors
     */
    const dynamicTotal = useMemo(() => {
        if (isSearch(cache.params) || loadingCounts) {
            return undefined;
        }
        return getTotal(counts, cache.params.labelID, cache.params.filter);
    }, [counts, loadingCounts, cache.params]);

    /**
     * Computed up to date number of elements on the current page
     * Warning: this value has been proved not to be 100% consistent
     * Has to be used only for non sensitive behaviors
     */
    const dynamicPageLength = useMemo(() => {
        if (dynamicTotal === undefined) {
            return undefined;
        }
        return expectedPageLength(
            cache.page,
            dynamicTotal,
            isFilter(cache.params.filter) ? cache.bypassFilter.length : 0
        );
    }, [dynamicTotal, cache.page, cache.params, cache.bypassFilter]);

    const placeholderCount = useMemo(() => {
        if (dynamicPageLength) {
            return dynamicPageLength;
        }
        if (cache.total !== undefined) {
            return expectedPageLength(
                cache.page,
                cache.total,
                isFilter(cache.params.filter) ? cache.bypassFilter.length : 0
            );
        }
        return DEFAULT_PLACEHOLDERS_COUNT;
    }, [dynamicPageLength, cache.page, cache.total, cache.params]);

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
            (cache.invalidated || !pageCached()));

    const shouldUpdatePage = () => pageChanged() && pageCached();

    const setEncryptedSearchResults: ESSetsElementsCache = (Elements, inputPage) => {
        const Total = Elements.length;
        const pages = range(0, Math.ceil(Total / PAGE_SIZE));
        // Retry is disabled for encrypted search results, to avoid re-triggering the search several times
        // when there are no results
        setCache((cache) => {
            return {
                params: cache.params,
                bypassFilter: [],
                beforeFirstLoad: false,
                invalidated: false,
                pendingRequest: false,
                page: inputPage || page,
                total: Total,
                pages,
                elements: toMap(Elements, 'ID'),
                updatedElements: [],
                retry: { payload: undefined, count: MAX_ELEMENT_LIST_LOAD_RETRIES, error: undefined },
            };
        });
    };

    const shouldLoadMoreES = () => useES && isCacheLimited && isSearchPartial && pageChanged() && !pageCached();

    const setPendingRequest = () => setCache((cache) => ({ ...cache, pendingRequest: true }));

    const updatePage = () => {
        if (useES) {
            if (shouldLoadMoreES()) {
                setPendingRequest();
            }
            void incrementSearch(page, setEncryptedSearchResults, shouldLoadMoreES());
        }
        if (!shouldLoadMoreES()) {
            setCache((cache) => ({ ...cache, page }));
        }
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
                    retry: newRetry(queryParameters, undefined),
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
                    retry: newRetry(queryParameters, error),
                }));
            }, 2000);
        }
    };

    const executeSearch = async () => {
        setPendingRequest();
        try {
            let success = false;
            if (useES) {
                success = await encryptedSearch(labelID, setEncryptedSearchResults);
            }
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
        if (shouldUpdatePage() || shouldLoadMoreES()) {
            void updatePage();
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
        if (page === 0) {
            return;
        }

        const expectingEmpty = dynamicPageLength === 0;
        const loadedEmpty = !cache.beforeFirstLoad && cache.pendingRequest === false && cache.total === 0;
        const partialESSearch = useES && isCacheLimited && isSearchPartial;

        if (!partialESSearch && (expectingEmpty || loadedEmpty)) {
            const count = dynamicTotal ? pageCount(dynamicTotal) : 0;
            if (count === 0) {
                onPage(0);
            } else if (page !== count - 1) {
                onPage(count - 1);
            }
        }
    }, [page, dynamicPageLength, cache.beforeFirstLoad, cache.pendingRequest, cache.total]);

    useEffect(() => {
        if (
            !cache.beforeFirstLoad &&
            !cache.pendingRequest &&
            cache.retry.error === undefined &&
            cache.retry.count === 3 &&
            !useES
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
                    dynamicTotal,
                    cache: omit(cache, ['elements']),
                    ...cache.elements, // Sentry limit depth in extra data, this optimize our feedback
                };
                console.error(message, context);
                captureMessage(message, { extra: { context } });
            }
            resetCache(cache.retry, !esEnabled && isSearch(search));
        }
    }, [cache.pendingRequest]);

    // Listen to event manager and update de cache
    useSubscribeEventManager(async ({ Conversations = [], Messages = [] }: Event) => {
        const Elements: ElementEvent[] = conversationMode ? Conversations : Messages;

        // If it's an encrypted search, its event manager will deal with the change
        if (useES) {
            return;
        }

        if (!Elements.length) {
            return;
        }

        if (!isLiveCache()) {
            if (Elements.length) {
                setCache((cache) => ({ ...cache, invalidated: true }));
            }
            return;
        }

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
                updatedElements,
            };
        });
    });

    const loading = (cache.beforeFirstLoad || cache.pendingRequest) && !cache.invalidated;
    const total = dynamicTotal || cache.total;

    return {
        labelID: cache.params.labelID,
        elements,
        placeholderCount,
        loading,
        total,
    };
};
