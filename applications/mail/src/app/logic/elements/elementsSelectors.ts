import { createSelector } from 'reselect';

import { ESDBStatus, ES_EXTRA_RESULTS_LIMIT } from '@proton/encrypted-search';
import { LabelCount } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import {
    DEFAULT_PLACEHOLDERS_COUNT,
    ELEMENTS_CACHE_REQUEST_SIZE,
    MAX_ELEMENT_LIST_LOAD_RETRIES,
    PAGE_SIZE,
} from '../../constants';
import { hasLabel, isFilter, isSearch, isUnread, sort as sortElements } from '../../helpers/elements';
import { expectedPageLength } from '../../helpers/paging';
import { ESMessage, NormalizedSearchParams } from '../../models/encryptedSearch';
import { SearchParameters } from '../../models/tools';
import { RootState } from '../store';
import { ElementsStateParams } from './elementsTypes';
import { getTotal } from './helpers/elementTotal';

const beforeFirstLoad = (state: RootState) => state.elements.beforeFirstLoad;
export const elementsMap = (state: RootState) => state.elements.elements;
export const params = (state: RootState) => state.elements.params;
const page = (state: RootState) => state.elements.page;
const pages = (state: RootState) => state.elements.pages;
const bypassFilter = (state: RootState) => state.elements.bypassFilter;
const pendingRequest = (state: RootState) => state.elements.pendingRequest;
export const pendingActions = (state: RootState) => state.elements.pendingActions;
const retry = (state: RootState) => state.elements.retry;
const invalidated = (state: RootState) => state.elements.invalidated;
const total = (state: RootState) => state.elements.total;
export const taskRunning = (state: RootState) => state.elements.taskRunning;

const currentPage = (_: RootState, { page }: { page: number }) => page;
const currentSearch = (_: RootState, { search }: { search: SearchParameters }) => search;
const currentParams = (_: RootState, { params }: { params: ElementsStateParams }) => params;
const currentESDBStatus = (
    _: RootState,
    { esDBStatus }: { esDBStatus: ESDBStatus<ESMessage, NormalizedSearchParams> }
) => esDBStatus;
const currentCounts = (_: RootState, { counts }: { counts: { counts: LabelCount[]; loading: boolean } }) => counts;

export const elements = createSelector(
    [elementsMap, params, page, pages, bypassFilter],
    (elements, params, page, pages, bypassFilter) => {
        // Getting all params from the cache and not from scoped params
        // To prevent any desynchronization between cache and the output of the memo
        const { labelID, sort, filter } = params;

        const minPage = pages.reduce((acc, page) => (page < acc ? page : acc), pages[0]);
        const startIndex = (page - minPage) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const elementsArray = Object.values(elements);
        const filtered = elementsArray
            .filter((element) => hasLabel(element, labelID))
            .filter((element) => {
                if (!isFilter(filter)) {
                    return true;
                }
                if (bypassFilter.includes(element.ID || '')) {
                    return true;
                }
                const elementUnread = isUnread(element, labelID);
                return filter.Unread ? elementUnread : !elementUnread;
            });
        const sorted = sortElements(filtered, sort, labelID);

        return sorted.slice(startIndex, endIndex);
    }
);

export const elementIDs = createSelector(elements, (elements): string[] =>
    elements.map((element) => element.ID).filter(isTruthy)
);

export const elementsLength = createSelector(elements, (elements) => elements.length);

export const elementsAreUnread = createSelector([params, elements], (params, elements) => {
    return elements.reduce<{ [elementID: string]: boolean }>((acc, element) => {
        acc[element.ID] = isUnread(element, params.labelID);
        return acc;
    }, {});
});

/**
 * Define when we need to request the API to get more elements
 * Dynamic computations (dynamicTotal and dynamicPageLength) have been proved not to be reliable enough
 * So the logic here is a lot more basic
 * It only checks when there is not a full page to show if the label has more than a cache size of elements
 * It doesn't rely at all on the optimistic counter logic
 */
export const needsMoreElements = createSelector([total, page, elementsLength], (total, page, elementsLength) => {
    if (total === undefined) {
        return false;
    }
    const howManyElementsAhead = total - page * PAGE_SIZE;
    return elementsLength < PAGE_SIZE && howManyElementsAhead > ELEMENTS_CACHE_REQUEST_SIZE;
});

export const paramsChanged = createSelector([params, currentParams], (params, currentParams) => {
    const paramsChanged =
        currentParams.labelID !== params.labelID ||
        currentParams.conversationMode !== params.conversationMode ||
        currentParams.sort !== params.sort ||
        currentParams.filter !== params.filter ||
        currentParams.search !== params.search ||
        (currentParams.esEnabled !== params.esEnabled && isSearch(currentParams.search));
    return paramsChanged;
});

export const pageCached = createSelector([pages, currentPage], (pages, currentPage) => pages.includes(currentPage));

export const pageChanged = createSelector([page, currentPage], (page, currentPage) => page !== currentPage);

export const pageIsConsecutive = createSelector(
    [pages, currentPage],
    (pages, currentPage) =>
        pages.length === 0 || pages.some((p) => p === currentPage || p === currentPage - 1 || p === currentPage + 1)
);

export const shouldResetCache = createSelector(
    [paramsChanged, pageIsConsecutive],
    (paramsChanged, pageIsConsecutive) => {
        return paramsChanged || !pageIsConsecutive;
    }
);

export const shouldSendRequest = createSelector(
    [shouldResetCache, pendingRequest, retry, needsMoreElements, invalidated, pageCached],
    (shouldResetCache, pendingRequest, retry, needsMoreElements, invalidated, pageCached) => {
        return (
            shouldResetCache ||
            (!pendingRequest &&
                retry.count < MAX_ELEMENT_LIST_LOAD_RETRIES &&
                (needsMoreElements || invalidated || !pageCached))
        );
    }
);

export const isLive = createSelector([params, pages], (params, pages) => !isSearch(params.search) && pages.includes(0));

export const shouldUpdatePage = createSelector(
    [pageChanged, pageCached],
    (pageChanged, pageCached) => pageChanged && pageCached
);

export const isES = createSelector(
    [currentESDBStatus, currentSearch],
    ({ dbExists, esEnabled, isCacheLimited }, search) =>
        dbExists && esEnabled && isSearch(search) && (!!search.keyword || !isCacheLimited)
);

/**
 * Loading more search results using ES should be done only under the
 * following circumstances:
 *  - ES is being used for the search;
 *  - the cache is limited, i.e. the local index is too large to safely fit
 *    in memory and there are messages which are only stored on disk;
 *  - the search is partial, meaning that the whole index on disk hasn't been
 *    fully searched yet;
 *  - a new page of results has been queried by the user's navigation;
 *  - the total number of messages in the results list is not enough to fill
 *    at least the current and the subsequent pages
 */
export const messagesToLoadMoreES = createSelector(
    [currentESDBStatus, isES, pageChanged, total, currentPage],
    ({ isCacheLimited, isSearchPartial }, useES, pageChanged, total, currentPage) => {
        if (
            useES &&
            isCacheLimited &&
            isSearchPartial &&
            pageChanged &&
            (total || 0) < (currentPage + 2) * ES_EXTRA_RESULTS_LIMIT
        ) {
            return (currentPage + 2) * ES_EXTRA_RESULTS_LIMIT - (total || 0);
        }
        return 0;
    }
);

/**
 * Computed up to date total of elements for the current parameters
 * Warning: this value has been proved not to be 100% consistent
 * Has to be used only for non sensitive behaviors
 */
export const dynamicTotal = createSelector([params, currentCounts], (params, { counts, loading }) => {
    if (isSearch(params.search) || loading) {
        return undefined;
    }
    return getTotal(counts, params.labelID, params.filter);
});

/**
 * Computed up to date number of elements on the current page
 * Warning: this value has been proved not to be 100% consistent
 * Has to be used only for non sensitive behaviors
 */
export const dynamicPageLength = createSelector(
    [page, dynamicTotal, params, bypassFilter],
    (page, dynamicTotal, params, bypassFilter) => {
        if (dynamicTotal === undefined) {
            return undefined;
        }
        return expectedPageLength(page, dynamicTotal, isFilter(params.filter) ? bypassFilter.length : 0);
    }
);

export const placeholderCount = createSelector(
    [page, total, params, dynamicPageLength],
    (page, total, params, dynamicPageLength) => {
        if (dynamicPageLength !== undefined) {
            return dynamicPageLength;
        }
        if (total !== undefined) {
            return expectedPageLength(page, total, isFilter(params.filter) ? bypassFilter.length : 0);
        }
        return DEFAULT_PLACEHOLDERS_COUNT;
    }
);

export const loading = createSelector(
    [beforeFirstLoad, pendingRequest, shouldSendRequest, invalidated],
    (beforeFirstLoad, pendingRequest, shouldSendRequest, invalidated) =>
        (beforeFirstLoad || pendingRequest || shouldSendRequest) && !invalidated
);

export const totalReturned = createSelector([dynamicTotal, total], (dynamicTotal, total) => dynamicTotal || total);

export const expectingEmpty = createSelector([dynamicPageLength], (dynamicPageLength) => dynamicPageLength === 0);

export const loadedEmpty = createSelector(
    [beforeFirstLoad, pendingRequest, total],
    (beforeFirstLoad, pendingRequest, total) => !beforeFirstLoad && pendingRequest === false && total === 0
);

export const partialESSearch = createSelector(
    [isES, currentESDBStatus],
    (useES, currentESDBStatus) => useES && currentESDBStatus.isCacheLimited && currentESDBStatus.isSearchPartial
);

export const stateInconsistency = createSelector(
    [beforeFirstLoad, pendingRequest, retry, isES],
    (beforeFirstLoad, pendingRequest, retry, useES) =>
        !beforeFirstLoad && !pendingRequest && retry.error === undefined && retry.count === 3 && !useES
);

export const showLabelTaskRunningBanner = createSelector([taskRunning], (taskRunning) => {
    return taskRunning.labelIDs.length > 0;
});
