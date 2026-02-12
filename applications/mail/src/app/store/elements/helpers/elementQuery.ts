import isDeepEqual from 'lodash/isEqual';

import { getConversation, queryConversations } from '@proton/shared/lib/api/conversations';
import type { MailboxItemsQueryParams } from '@proton/shared/lib/api/mailbox';
import { getMessage, queryMessageMetadata } from '@proton/shared/lib/api/messages';
import { omit, pick } from '@proton/shared/lib/helpers/object';
import type { Api } from '@proton/shared/lib/interfaces';
import { CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import range from '@proton/utils/range';

import {
    convertCategoryLabelToCategoryAndInbox,
    convertCustomViewLabelsToAlmostAllMail,
} from '../../../helpers/labels';
import type { Element } from '../../../models/element';
import type { MailState } from '../../store';
import { pollTaskRunning } from '../elementsActions';
import type { ElementsStateParams, QueryParams, QueryResults, RetryData } from '../elementsTypes';

export const TASK_RUNNING_POLLING_INTERVAL = 10000;

const PAGE_FETCH_COUNT = 2;

const getQueryElementsParameters = ({
    page,
    pageSize,
    params: { labelID, sort, search, filter, newsletterSubscriptionID },
    disabledCategoriesIDs,
}: Pick<QueryParams, 'page' | 'pageSize'> & {
    params: ElementsStateParams;
    disabledCategoriesIDs: string[];
}): MailboxItemsQueryParams => {
    // Use ALMOST_ALL_MAIL as the LabelID when we're viewing a custom view like a newsletter subscription
    let effectiveLabelID: string | string[] = convertCustomViewLabelsToAlmostAllMail(labelID);

    // Use [INBOX, CATEGORY_ID] when we're viewing a category to only show elements in both INBOX and CATEGORY_ID
    effectiveLabelID = convertCategoryLabelToCategoryAndInbox(effectiveLabelID, disabledCategoriesIDs);

    // Only send NewsletterSubscriptionID when we're actually in the newsletter subscriptions view
    const shouldIncludeNewsletterSubscriptionID = labelID === CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS;

    return {
        Page: page,
        PageSize: pageSize,
        Limit: pageSize,
        LabelID: effectiveLabelID,
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
        Attachments: filter.Attachments,
        Unread: filter.Unread,
        AddressID: search.address,
        // ID,
        AutoWildcard: search.wildcard,
        NewsletterSubscriptionID: shouldIncludeNewsletterSubscriptionID ? (newsletterSubscriptionID ?? null) : null,
    };
};

/**
 *
 * @param page
 * @param pageSize
 * @param params common query parameters
 * @param conversationMode whether the mailbox is in conversation or messages view
 * @returns
 */
export const queryElementsInBatch = async (
    {
        api,
        page,
        pageSize,
        params,
        abortController,
        disabledCategoriesIDs,
    }: {
        api: Api;
        page: number;
        pageSize: number;
        params: ElementsStateParams;
        abortController?: AbortController;
        disabledCategoriesIDs: string[];
    },
    onSerializedResponse?: (param: { result: QueryResults; page: number }) => void
) => {
    const { conversationMode } = params;

    const queryParameters = getQueryElementsParameters({
        page,
        pageSize,
        params,
        disabledCategoriesIDs,
    });

    abortController?.abort();
    const newAbortController = new AbortController();
    const initialPromise = Promise.resolve({
        abortController: newAbortController,
        More: true,
        Elements: [],
        // Initial total is -1 to discriminate it from a Total: 0 sent back from API
        Total: -1,
        Stale: 0,
        TasksRunning: [],
        ...('Anchor' in queryParameters && {
            Anchor: queryParameters.Anchor,
            AnchorID: queryParameters.AnchorID,
        }),
    });

    return range(0, PAGE_FETCH_COUNT).reduce(
        (lastCall: Promise<QueryResults | (QueryResults & { AnchorID: string; Anchor: string })>, _, index) => {
            return lastCall.then(async (previousResult) => {
                if (!previousResult.More) {
                    return previousResult;
                }

                const query = conversationMode ? queryConversations : queryMessageMetadata;

                const internalQueryParameters = {
                    ...omit(queryParameters, ['Page', 'PageSize']),
                    Limit: pageSize,
                    // If we get Anchor/AnchorID from previous result, we use it, else we use classic pagination
                    ...('Anchor' in previousResult
                        ? {
                              Anchor: previousResult.Anchor,
                              AnchorID: previousResult.AnchorID,
                          }
                        : pick(queryParameters, ['Page', 'PageSize'])),
                };

                const result = await api({
                    ...query(internalQueryParameters),
                    signal: newAbortController.signal,
                });

                const elements = conversationMode ? result.Conversations : result.Messages;
                const lastElement = elements[pageSize - 1];

                const queryResult = {
                    abortController: newAbortController,
                    More: elements.length >= pageSize,
                    Elements: elements,
                    ...(lastElement && {
                        AnchorID: lastElement.ID,
                        Anchor: lastElement[queryParameters.Sort ?? 'Time'],
                    }),
                    // We take the Total of the first request only as the others are affected by the Anchor/AnchorID parameters.
                    // Initial Total is set to -1 to discriminate it from Total: 0 sent back by API
                    Total: previousResult.Total < 0 ? result.Total : previousResult.Total,
                    ...pick(result, ['Stale', 'TasksRunning']),
                };

                onSerializedResponse?.({ result: queryResult, page: page + index });
                return queryResult;
            });
        },
        initialPromise
    );
};

export const queryElements = async (
    api: Api,
    abortController: AbortController | undefined,
    conversationMode: boolean,
    params: MailboxItemsQueryParams
): Promise<QueryResults> => {
    abortController?.abort();
    const newAbortController = new AbortController();

    const query = conversationMode
        ? api({
              ...queryConversations(params),
              signal: newAbortController.signal,
          })
        : api({
              ...queryMessageMetadata(params),
              signal: newAbortController.signal,
          });

    const result = await query;

    return {
        abortController: newAbortController,
        Total: result.Total,
        Elements: conversationMode ? result.Conversations : result.Messages,
        Stale: result.Stale,
        TasksRunning: result.TasksRunning,
    };
};

/**
 * A retry is the same request as before expecting a different result
 * @param payload: request params + expected total
 * @param error: optional error from last request
 */
export const newRetry = (retry: RetryData, payload: unknown, error: Error | undefined) => {
    const count = error && isDeepEqual(payload, retry.payload) ? retry.count + 1 : 1;
    return { payload, count, error };
};

export const queryElement = async (api: Api, messageMode: boolean, elementID: string): Promise<Element> => {
    const query = messageMode ? getMessage : getConversation;
    const result: any = await api({ ...query(elementID), silence: true });
    return messageMode ? result.Message : result.Conversation;
};

export const refreshTaskRunningTimeout = (
    newLabelIDs: string[],
    { getState, dispatch }: { getState: () => unknown; dispatch: (action: any) => void }
): NodeJS.Timeout | undefined => {
    let timeoutID: NodeJS.Timeout | undefined = (getState() as MailState).elements.taskRunning.timeoutID;

    if (timeoutID) {
        clearTimeout(timeoutID);
        timeoutID = undefined;
    }

    if (newLabelIDs.length > 0) {
        timeoutID = setTimeout(() => {
            void dispatch(pollTaskRunning());
        }, TASK_RUNNING_POLLING_INTERVAL);
    }

    return timeoutID;
};
