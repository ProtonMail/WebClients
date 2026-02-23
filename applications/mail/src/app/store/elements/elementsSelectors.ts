import { createSelector } from '@reduxjs/toolkit';

import type { ESStatus } from '@proton/encrypted-search';
import { ES_EXTRA_RESULTS_LIMIT } from '@proton/encrypted-search/constants';
import type { NormalizedSearchParams } from '@proton/encrypted-search/lib/models/mail';
import { selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import type { MailSettingState } from '@proton/mail/store/mailSettings';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';
import { CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';
import type { SearchParameters } from '@proton/shared/lib/mail/search';
import isTruthy from '@proton/utils/isTruthy';

import { DEFAULT_PLACEHOLDERS_COUNT, MAX_ELEMENT_LIST_LOAD_RETRIES } from '../../constants';
import {
    filterElementsInState,
    getElementContextIdentifier,
    hasAttachmentsFilter,
    isEmpty,
    isSearch,
    isUnread,
    sort as sortElements,
} from '../../helpers/elements';
import { expectedPageLength, isPageConsecutive } from '../../helpers/paging';
import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch';
import { selectedSubscriptionSelector } from '../newsletterSubscriptions/newsletterSubscriptionsSelector';
import type { MailState } from '../store';
import { getTotal } from './helpers/elementTotal';

export const params = (state: MailState) => state.elements.params;

export const selectLabelID = createSelector([params], (params) => params.labelID);
export const selectElementID = createSelector([params], (params) => params.elementID);
export const selectMessageID = createSelector([params], (params) => params.messageID);
export const selectConversationMode = createSelector([params], (params) => params.conversationMode);
export const selectSort = createSelector([params], (params) => params.sort);
export const selectFilter = createSelector([params], (params) => params.filter);
export const selectSearch = createSelector([params], (params) => params.search);
export const selectESEnabled = createSelector([params], (params) => params.esEnabled);
export const selectisSearching = createSelector([params], (params) => params.isSearching);
export const selectNewsletterSubscriptionID = createSelector([params], (params) => params.newsletterSubscriptionID);

const beforeFirstLoad = (state: MailState) => state.elements.beforeFirstLoad;
export const elementsMap = (state: MailState) => state.elements.elements;
const page = (state: MailState) => state.elements.page;
export const pageSize = (state: MailSettingState) => state.mailSettings.value?.PageSize || MAIL_PAGE_SIZE.FIFTY;
const pages = (state: MailState) => state.elements.pages;
const bypassFilter = (state: MailState) => state.elements.bypassFilter;
export const pendingRequest = (state: MailState) => state.elements.pendingRequest;
export const pendingActions = (state: MailState) => state.elements.pendingActions;
const retry = (state: MailState) => state.elements.retry;
const invalidated = (state: MailState) => state.elements.invalidated;
export const total = (state: MailState) => state.elements.total;
export const taskRunning = (state: MailState) => state.elements.taskRunning;
export const addresses = (state: MailState) => state.addresses;

const currentPage = (_: MailState, { page }: { page: number }) => page;
const currentSearch = (_: MailState, { search }: { search: SearchParameters }) => search;
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

export const contextPages = createSelector([params, pages], (params, pages) => {
    const contextFilter = getElementContextIdentifier({
        labelID: params.labelID,
        conversationMode: params.conversationMode,
        filter: params.filter,
        sort: params.sort,
        from: params.search.from,
        to: params.search.to,
        address: params.search.address,
        begin: params.search.begin,
        end: params.search.end,
        keyword: params.search.keyword,
        newsletterSubscriptionID: params.newsletterSubscriptionID,
    });

    return pages[contextFilter] || [];
});

export const contextTotal = createSelector([params, total], (params, total) => {
    const contextFilter = getElementContextIdentifier({
        labelID: params.labelID,
        conversationMode: params.conversationMode,
        filter: params.filter,
        sort: params.sort,
        from: params.search.from,
        to: params.search.to,
        address: params.search.address,
        begin: params.search.begin,
        end: params.search.end,
        keyword: params.search.keyword,
        newsletterSubscriptionID: params.newsletterSubscriptionID,
    });

    return total[contextFilter];
});

export const elements = createSelector(
    [elementsMap, params, page, pageSize, contextPages, bypassFilter, addresses, selectDisabledCategoriesIDs],
    (elements, params, page, pageSize, pages, bypassFilter, addresses, selectDisabledCategoriesIDs) => {
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
        // If the page has not been loaded on this filter, return an empty array of elements so that we
        // don't show them during loading, preventing the user from creating currency in requests
        // e.g. applying actions while loading elements
        const filtered = pages.includes(page)
            ? filterElementsInState({
                  elements: elementsArray,
                  addresses: addresses?.value,
                  bypassFilter,
                  labelID,
                  filter,
                  conversationMode,
                  search,
                  newsletterSubscriptionID: params.newsletterSubscriptionID,
                  disabledCategoriesIDs: selectDisabledCategoriesIDs,
              })
            : [];

        const sorted = sortElements(filtered, finalSort, labelID);

        // We only keep a slice of the cached elements: the ones we want to display in the current List view
        return sorted.slice(startIndex, endIndex);
    }
);

export const elementIDs = createSelector(elements, (elements): string[] =>
    elements.map((element) => element.ID).filter(isTruthy)
);

export const elementsLength = createSelector([elements], (elements) => {
    // no need for additional filters since elements selector is already applying filters
    return elements.length;
});

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
    [contextTotal, page, pageSize, elementsLength, params],
    (total, page, pageSize, elementsLength, params) => {
        // There are no elements for newsletter subscriptions if there is no newsletter subscription ID
        if (params.labelID === CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS && !params.newsletterSubscriptionID) {
            return false;
        }

        if (!total) {
            return false;
        }
        const numberOfPages = Math.ceil(total / pageSize);

        // currentPage starts from 1
        // If there is only one page left of pageSize elements, the modulo won't work (50%50 = 0).
        // Meaning that if we have no element in the cache, the selector will be false, and we won't trigger a load
        // To avoid that, we can return the total (or pageSize, since it will be the same) to trigger a load.
        if (page + 1 === numberOfPages) {
            return elementsLength < (total % pageSize === 0 ? pageSize : total % pageSize);
        }
        return elementsLength < pageSize;
    }
);

/**
 * @returns a boolean specifying whether the current page is in the cache or not.
 */
export const pageCached = createSelector([contextPages, currentPage], (pages, currentPage) =>
    pages.includes(currentPage)
);

/**
 * @returns a boolean specifying whether the current page is the one set in the store or not.
 */
export const pageChanged = createSelector([page, currentPage], (page, currentPage) => page !== currentPage);

/**
 * @returns a boolean specifying whether the cache contains a page that is +/-1 the current page.
 * It is useful to check if there is page jump and refetch accordingly
 */
export const pageIsConsecutive = createSelector([contextPages, currentPage], (pages, currentPage) =>
    isPageConsecutive(pages, currentPage)
);

/**
 * @returns a boolean specifying whether or elements should be loading (either fetched or loaded with ES).
 * It should be true either when `shouldResetElementsState` or
 */
export const shouldLoadElements = createSelector(
    [pendingRequest, retry, needsMoreElements, invalidated, pageCached, params, taskRunning],
    (pendingRequest, retry, needsMoreElements, invalidated, pageCached, params, taskRunning) => {
        // Prevent elements from loading in locations where a task is running
        const taskRunningInLabel = taskRunning.labelIDs.includes(params.labelID);

        return (
            !taskRunningInLabel &&
            !pendingRequest &&
            retry.count < MAX_ELEMENT_LIST_LOAD_RETRIES &&
            (needsMoreElements || invalidated || !pageCached)
        );
    }
);

/**
 * @returns true when user is in an unpredictable context because we don't have enough conversations/message metadata infos
 */
export const shouldInvalidateElementsState = createSelector(
    [params, contextPages],
    (params, pages) => !!params.search.keyword || !pages.includes(0)
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
    [currentESDBStatus, isES, pageChanged, contextTotal, currentPage],
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
 * Computed up-to-date total of elements for the current parameters
 * Warning: this value has been proved not to be 100% consistent
 * Has to be used only for non-sensitive behaviors
 *
 * labelID - string | undefined - This label ID is the one we use in useElement which is based on the URL value
 * We prefer using this value when present because store one is not immediately up to date when switching labels
 */
export const dynamicTotal = createSelector(
    [params, currentCounts, bypassFilter, taskRunning],
    (params, props, bypassFilter, taskRunning) => {
        const { counts, loading } = props;
        if (
            isSearch(params.search) ||
            hasAttachmentsFilter(params.filter) ||
            loading ||
            taskRunning.labelIDs.includes(params.labelID)
        ) {
            return undefined;
        }

        return getTotal(counts, params.labelID, params.filter, bypassFilter.length);
    }
);

/**
 * Computed up-to-date number of elements on the current page for custom views
 * In the future, we can include other custom views like "Attachments" or "Promotions" etc.
 * Modify this selector to add other custom views only if we have the expected length of elements to load.
 */
export const customViewDynamicPageLength = createSelector(
    [params, pageSize, selectedSubscriptionSelector],
    (params, pageSize, selectedSubscription) => {
        switch (params.labelID) {
            case CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS:
                return Math.min(selectedSubscription?.ReceivedMessageCount ?? 0, pageSize);
            default:
                return undefined;
        }
    }
);

/**
 * Computed up-to-date number of elements on the current page
 * Warning: this value has been proved not to be 100% consistent
 * Has to be used only for non-sensitive behaviors
 */
export const dynamicPageLength = createSelector(
    [page, pageSize, dynamicTotal, params, bypassFilter, customViewDynamicPageLength],
    (page, pageSize, dynamicTotal, params, bypassFilter, customViewLength) => {
        if (customViewLength !== undefined) {
            return customViewLength;
        }
        if (dynamicTotal === undefined) {
            return undefined;
        }
        return expectedPageLength(page, pageSize, dynamicTotal, isEmpty(params.filter) ? bypassFilter.length : 0);
    }
);

export const placeholderCount = createSelector(
    [page, pageSize, contextTotal, params, dynamicPageLength, bypassFilter],
    (page, pageSize, total, params, dynamicPageLength, bypassFilter) => {
        if (dynamicPageLength !== undefined) {
            return dynamicPageLength;
        }
        if (total !== undefined) {
            return expectedPageLength(page, pageSize, total, isEmpty(params.filter) ? 0 : bypassFilter.length);
        }
        return DEFAULT_PLACEHOLDERS_COUNT;
    }
);

export const loading = createSelector(
    [beforeFirstLoad, pendingRequest, shouldLoadElements, invalidated],
    (beforeFirstLoad, pendingRequest, shouldLoadElements, invalidated) =>
        (beforeFirstLoad || pendingRequest || shouldLoadElements) && !invalidated
);

export const totalReturned = createSelector([contextTotal, dynamicTotal], (contextTotal, dynamicTotal) => {
    return dynamicTotal || contextTotal;
});

export const expectingEmpty = createSelector([dynamicPageLength], (dynamicPageLength) => dynamicPageLength === 0);

export const loadedEmpty = createSelector(
    [beforeFirstLoad, pendingRequest, contextTotal],
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

export const taskRunningInLabel = createSelector([taskRunning, currentLabelID], (taskRunning, labelID) => {
    return taskRunning.labelIDs.find((id) => id === labelID);
});
