import { createSelector } from '@reduxjs/toolkit';

import type { ESStatus } from '@proton/encrypted-search';
import { ES_EXTRA_RESULTS_LIMIT } from '@proton/encrypted-search';
import type { NormalizedSearchParams } from '@proton/encrypted-search/lib/models/mail';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';
import type { SearchParameters } from '@proton/shared/lib/mail/search';
import isTruthy from '@proton/utils/isTruthy';

import { DEFAULT_PLACEHOLDERS_COUNT, MAX_ELEMENT_LIST_LOAD_RETRIES } from '../../constants';
import {
    hasAttachments,
    hasAttachmentsFilter,
    hasLabel,
    isConversation,
    isEmpty,
    isMessage,
    isSearch,
    isUnread,
    matchBegin,
    matchEmailAddress,
    matchEnd,
    matchFrom,
    matchTo,
    sort as sortElements,
} from '../../helpers/elements';
import { expectedPageLength, isPageConsecutive } from '../../helpers/paging';
import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch';
import type { MailState } from '../store';
import type { ElementsStateParams } from './elementsTypes';
import { getTotal } from './helpers/elementTotal';

const beforeFirstLoad = (state: MailState) => state.elements.beforeFirstLoad;
export const elementsMap = (state: MailState) => state.elements.elements;
export const params = (state: MailState) => state.elements.params;
const page = (state: MailState) => state.elements.page;
export const pageSize = (state: MailState) => state.elements.pageSize;
export const pages = (state: MailState) => state.elements.pages;
const bypassFilter = (state: MailState) => state.elements.bypassFilter;
const pendingRequest = (state: MailState) => state.elements.pendingRequest;
export const pendingActions = (state: MailState) => state.elements.pendingActions;
const retry = (state: MailState) => state.elements.retry;
const invalidated = (state: MailState) => state.elements.invalidated;
export const total = (state: MailState) => state.elements.total;
export const taskRunning = (state: MailState) => state.elements.taskRunning;
export const addresses = (state: MailState) => state.addresses;

const currentPage = (_: MailState, { page }: { page: number }) => page;
const currentSearch = (_: MailState, { search }: { search: SearchParameters }) => search;
// currentParams corresponds to the parameters set by the user from the interface
const currentParams = (_: MailState, { params }: { params: ElementsStateParams }) => params;
const currentESDBStatus = (
    _: MailState,
    {
        esStatus,
    }: {
        esStatus: ESStatus<ESBaseMessage, ESMessageContent, NormalizedSearchParams>;
    }
) => esStatus;
const currentCounts = (_: MailState, { counts }: { counts: { counts: LabelCount[]; loading: boolean } }) => counts;
const currentLabelID = (_: MailState, { labelID }: { labelID: string }) => labelID;

export const elements = createSelector(
    [elementsMap, params, page, pageSize, pages, bypassFilter, addresses],
    (elements, params, page, pageSize, pages, bypassFilter, addresses) => {
        // Getting all params from the cache and not from scoped params
        // To prevent any de-synchronization between cache and the output of the memo
        const { labelID, sort, filter, conversationMode, search } = params;
        let finalSort = { ...sort };
        // The default sorting needs to be overridden when in inbox or snooze to display snoozed emails on top
        const isInSnoozeOrInbox = labelID === MAILBOX_LABEL_IDS.INBOX || labelID === MAILBOX_LABEL_IDS.SNOOZED;
        if (isInSnoozeOrInbox && sort.sort === 'Time') {
            finalSort = {
                sort: 'SnoozeTime',
                desc: labelID === MAILBOX_LABEL_IDS.SNOOZED ? !sort.desc : sort.desc,
            };
        }

        const minPage = pages.length > 0 ? Math.min(...pages) : 0;
        const startIndex = (page - minPage) * pageSize;
        const endIndex = startIndex + pageSize;

        const elementsArray = Object.values(elements);

        /**
         * Here we do a client-side filtering because of fake-unread:
         * when a user click on a message, it is set as read, but we don't it to disappear until page refresh
         *
         * Since the cache is only a little subset of user's messages, it is not very costly.
         */
        const address = search.address ? addresses.value?.find((address) => address.ID === search.address) : undefined;
        const filtered = elementsArray.filter((element) => {
            // Check ID and label first (cheapest operations)
            if (bypassFilter.length > 0 && !bypassFilter.includes(element.ID || '')) {
                return false;
            }
            if (!hasLabel(element, labelID)) {
                return false;
            }

            // Check element type (cheap operation)
            if (conversationMode ? !isConversation(element) : !isMessage(element)) {
                return false;
            }

            // Check simple filters
            if (filter.Attachments === 1 && !hasAttachments(element)) {
                return false;
            }

            const elementUnread = isUnread(element, labelID);
            if (filter.Unread && (filter.Unread === 1 ? !elementUnread : elementUnread)) {
                return false;
            }

            // More expensive email address checks
            if (search.from && !matchFrom(element, search.from)) {
                return false;
            }
            if (search.to && !matchTo(element, search.to)) {
                return false;
            }
            if (address && !matchEmailAddress(element, address.Email)) {
                return false;
            }

            // Date checks last (usually most expensive due to date operations)
            if (search.end && !matchEnd(element, labelID, search.end)) {
                return false;
            }
            if (search.begin && !matchBegin(element, labelID, search.begin)) {
                return false;
            }

            return true;
        });

        const sorted = sortElements(filtered, finalSort, labelID);

        // We only keep a slice of the cached elements: the ones we want to display in the current List view
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

export const expiringElements = createSelector([params, elements], (params, elements) => {
    return elements.reduce<{ [elementID: string]: boolean }>((acc, element) => {
        acc[element.ID] = !!element.ExpirationTime && element.ExpirationTime > 0;
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
export const needsMoreElements = createSelector(
    [total, page, pageSize, elementsLength],
    (total, page, pageSize, elementsLength) => {
        if (!total) {
            return false;
        }

        const numberOfPages = Math.ceil(total / pageSize);

        // currentPage starts from 1
        const expectedElementsInPage = page + 1 === numberOfPages ? total % pageSize : pageSize;
        return elementsLength < expectedElementsInPage;
    }
);

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

/**
 * @returns a boolean specifying whether or not the current page is in the cache or not.
 */
export const pageCached = createSelector([pages, currentPage], (pages, currentPage) => pages.includes(currentPage));

/**
 * @returns a boolean specifying whether or not the current page is the one set in the store or not.
 */
export const pageChanged = createSelector([page, currentPage], (page, currentPage) => page !== currentPage);

/**
 * @returns a boolean specifying whether or not the cache contains a page that is +/-1 the current page.
 * It is useful to check if there is page jump and refetch accordingly
 */
export const pageIsConsecutive = createSelector([pages, currentPage], (pages, currentPage) =>
    isPageConsecutive(pages, currentPage)
);

/**
 * @returns a boolean specifying whether or not the elements state should be reset, including `elements` cache.
 * It should be `true` whenever one of the search params changes or when a page jump occurs (e.g: users from page 2 to page 7)
 */
export const shouldResetElementsState = createSelector(
    [params, currentParams, pageIsConsecutive],
    (params, currentParams, pageIsConsecutive) => {
        return (
            currentParams.search.keyword !== params.search.keyword || // Reset the cache since we do not support client search (filtering)
            (currentParams.esEnabled !== params.esEnabled && isSearch(currentParams.search)) ||
            !pageIsConsecutive
        );
    }
);

/**
 * @returns a boolean specifying whether or elements should be loading (either fetched or loaded with ES).
 * It should be true either when `shouldResetElementsState` or
 */
export const shouldLoadElements = createSelector(
    [paramsChanged, pendingRequest, retry, needsMoreElements, invalidated, pageCached],
    (paramsChanged, pendingRequest, retry, needsMoreElements, invalidated, pageCached) => {
        return (
            paramsChanged ||
            (!pendingRequest &&
                retry.count < MAX_ELEMENT_LIST_LOAD_RETRIES &&
                (needsMoreElements || invalidated || !pageCached))
        );
    }
);

/**
 * @returns true when user is in a unpredicable context because we don't have enough conversations/message metadata infos
 */
export const shouldInvalidateElementsState = createSelector(
    [params, pages],
    (params, pages) => isSearch(params.search) || hasAttachmentsFilter(params.filter) || !pages.includes(0)
);

export const shouldUpdatePage = createSelector(
    [pageChanged, pageCached],
    (pageChanged, pageCached) => pageChanged && pageCached
);

export const isES = createSelector(
    [currentESDBStatus, currentSearch],
    ({ dbExists, esEnabled, getCacheStatus }, search) => {
        const { isCacheLimited } = getCacheStatus();
        return dbExists && esEnabled && isSearch(search) && (!!search.keyword || !isCacheLimited);
    }
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
    ({ getCacheStatus, isSearchPartial }, useES, pageChanged, total, currentPage) => {
        const { isCacheLimited } = getCacheStatus();

        if (
            useES &&
            isCacheLimited &&
            isSearchPartial &&
            pageChanged &&
            (total ?? 0) < (currentPage + 2) * ES_EXTRA_RESULTS_LIMIT
        ) {
            return (currentPage + 2) * ES_EXTRA_RESULTS_LIMIT - (total ?? 0);
        }
        return 0;
    }
);

/**
 * Computed up to date total of elements for the current parameters
 * Warning: this value has been proved not to be 100% consistent
 * Has to be used only for non sensitive behaviors
 *
 * labelID - string | undefined - This label ID is the one we use in useElement which is based on the URL value
 * We prefer using this value when present because store one is not immediately up to date when switching labels
 */
export const dynamicTotal = createSelector(
    [params, currentCounts, bypassFilter, currentLabelID],
    (params, props, bypassFilter, labelID) => {
        const { counts, loading } = props;
        if (isSearch(params.search) || hasAttachmentsFilter(params.filter) || loading) {
            return undefined;
        }

        return getTotal(counts, labelID || params.labelID, params.filter, bypassFilter.length);
    }
);

/**
 * Computed up to date number of elements on the current page
 * Warning: this value has been proved not to be 100% consistent
 * Has to be used only for non sensitive behaviors
 */
export const dynamicPageLength = createSelector(
    [page, pageSize, dynamicTotal, params, bypassFilter],
    (page, pageSize, dynamicTotal, params, bypassFilter) => {
        if (dynamicTotal === undefined) {
            return undefined;
        }
        return expectedPageLength(page, pageSize, dynamicTotal, isEmpty(params.filter) ? bypassFilter.length : 0);
    }
);

export const placeholderCount = createSelector(
    [page, pageSize, total, params, dynamicPageLength],
    (page, pageSize, total, params, dynamicPageLength) => {
        if (dynamicPageLength !== undefined) {
            return dynamicPageLength;
        }
        if (total !== undefined) {
            return expectedPageLength(page, pageSize, total, isEmpty(params.filter) ? bypassFilter.length : 0);
        }
        return DEFAULT_PLACEHOLDERS_COUNT;
    }
);

export const loading = createSelector(
    [beforeFirstLoad, pendingRequest, shouldLoadElements, invalidated],
    (beforeFirstLoad, pendingRequest, shouldLoadElements, invalidated) =>
        (beforeFirstLoad || pendingRequest || shouldLoadElements) && !invalidated
);

export const totalReturned = createSelector([dynamicTotal, total], (dynamicTotal, total) => dynamicTotal || total);

export const expectingEmpty = createSelector([dynamicPageLength], (dynamicPageLength) => dynamicPageLength === 0);

export const loadedEmpty = createSelector(
    [beforeFirstLoad, pendingRequest, total],
    (beforeFirstLoad, pendingRequest, total) => !beforeFirstLoad && pendingRequest === false && total === 0
);

export const partialESSearch = createSelector([isES, currentESDBStatus], (useES, currentESDBStatus) => {
    const { isCacheLimited } = currentESDBStatus.getCacheStatus();

    return useES && isCacheLimited && currentESDBStatus.isSearchPartial;
});

export const stateInconsistency = createSelector(
    [beforeFirstLoad, pendingRequest, retry, isES],
    (beforeFirstLoad, pendingRequest, retry, useES) =>
        !beforeFirstLoad && !pendingRequest && retry.error === undefined && retry.count === 3 && !useES
);

export const showLabelTaskRunningBanner = createSelector([taskRunning, currentLabelID], (taskRunning, labelID) => {
    return taskRunning.labelIDs.includes(labelID);
});
