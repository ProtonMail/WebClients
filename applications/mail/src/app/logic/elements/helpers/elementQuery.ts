import { getConversation, queryConversations } from '@proton/shared/lib/api/conversations';
import { MailboxItemsQueryParams } from '@proton/shared/lib/api/mailbox';
import { getMessage, queryMessageMetadata } from '@proton/shared/lib/api/messages';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { omit, pick } from '@proton/shared/lib/helpers/object';
import { Api } from '@proton/shared/lib/interfaces';
import range from '@proton/utils/range';

import { Element } from '../../../models/element';
import { RootState } from '../../store';
import { pollTaskRunning } from '../elementsActions';
import { ElementsStateParams, QueryParams, QueryResults, RetryData } from '../elementsTypes';

export const TASK_RUNNING_POLLING_INTERVAL = 10000;

const PAGE_FETCH_COUNT = 2;

const getQueryElementsParameters = ({
    page,
    pageSize,
    params: { labelID, sort, search, filter },
}: Pick<QueryParams, 'page' | 'params' | 'pageSize'>): MailboxItemsQueryParams => ({
    Page: page,
    PageSize: pageSize,
    Limit: pageSize,
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
    Attachments: filter.Attachments,
    Unread: filter.Unread,
    AddressID: search.address,
    // ID,
    AutoWildcard: search.wildcard,
});

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
    }: {
        api: Api;
        page: number;
        pageSize: number;
        params: ElementsStateParams;
        abortController?: AbortController;
    },
    onSerializedResponse?: (param: { index: number; result: QueryResults; page: number }) => void
) => {
    const { conversationMode } = params;

    const queryParameters = getQueryElementsParameters({
        page,
        pageSize,
        params,
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

                const newElements = [...previousResult.Elements, ...elements];

                const queryResult = {
                    abortController: newAbortController,
                    More: elements.length >= pageSize,
                    Elements: newElements,
                    ...(lastElement && {
                        AnchorID: lastElement.ID,
                        Anchor: lastElement[queryParameters.Sort ?? 'Time'],
                    }),
                    // We take the Total of the first request only as the others are affected by the Anchor/AnchorID parameters.
                    // Initial Total is set to -1 to discriminate it from Total: 0 sent back by API
                    Total: previousResult.Total < 0 ? result.Total : previousResult.Total,
                    ...pick(result, ['Stale', 'TasksRunning']),
                };

                onSerializedResponse?.({ index, result: queryResult, page: page + index });
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

export const queryElement = async (api: Api, conversationMode: boolean, elementID: string): Promise<Element> => {
    const query = conversationMode ? getConversation : getMessage;
    const result: any = await api({ ...query(elementID), silence: true });
    return conversationMode ? result.Conversation : result.Message;
};

export const refreshTaskRunningTimeout = (
    newLabelIDs: string[],
    { getState, dispatch }: { getState: () => unknown; dispatch: (action: any) => void }
): NodeJS.Timeout | undefined => {
    let timeoutID: NodeJS.Timeout | undefined = (getState() as RootState).elements.taskRunning.timeoutID;

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
