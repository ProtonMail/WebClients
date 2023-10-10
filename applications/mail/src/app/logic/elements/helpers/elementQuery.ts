import { getConversation, queryConversations } from '@proton/shared/lib/api/conversations';
import { MailboxItemsQueryParams } from '@proton/shared/lib/api/mailbox';
import { getMessage, queryMessageMetadata } from '@proton/shared/lib/api/messages';
import { MAX_MESSAGES_FETCH_CHUNK_SIZE } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { omit, pick } from '@proton/shared/lib/helpers/object';
import { Api, MailPageSize } from '@proton/shared/lib/interfaces';
import range from '@proton/utils/range';

import { Element } from '../../../models/element';
import { RootState } from '../../store';
import { pollTaskRunning } from '../elementsActions';
import { ElementsStateParams, QueryParams, QueryResults, RetryData } from '../elementsTypes';

export const TASK_RUNNING_POLLING_INTERVAL = 2000;

const limitByPageSize: Record<MailPageSize, number> = {
    [MailPageSize.FIFTY]: 100,
    [MailPageSize.ONE_HUNDRED]: 150, // TODO should be set to 200 when API enables this
    [MailPageSize.TWO_HUNDRED]: 150, // TODO should be set to 200 when API enables this
};

export const getQueryElementsParameters = ({
    page,
    pageSize,
    params: { labelID, sort, search, filter },
}: Pick<QueryParams, 'page' | 'params' | 'pageSize'>): MailboxItemsQueryParams => ({
    Page: page,
    PageSize: pageSize,
    Limit: limitByPageSize[pageSize],
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
 * @param clientPage current page number set on client (it might differ from page requested to API if settingsPageSize is greater than MAX_MESSAGES_FETCH_CHUNK_SIZE)
 * @param settingsPageSize page size saved in settings, it might be greater than MAX_MESSAGES_FETCH_CHUNK_SIZE (100 or 200), so we'll chunk it into multiple requests
 * @param params common query parameters
 * @param conversationMode whether the mailbox is in conversation or messages view
 * @returns
 */
export const queryElementsInBatch = async (
    api: Api,
    clientPage: number,
    settingsPageSize: number,
    params: ElementsStateParams,
    abortController?: AbortController
) => {
    const { conversationMode } = params;

    /**
     * We don't want to fetch more than `MAX_MESSAGES_FETCH_CHUNK_SIZE` items at once, so to fill a whole page, we might need to chunk fetching
     */
    const chunksPerPage = Math.ceil(settingsPageSize / MAX_MESSAGES_FETCH_CHUNK_SIZE);

    /**
     * Turns page & pageSize settings into params that fits API requirements
     * - Example: if `settingsPageSize = 200` & `page = 3`, we cannot send such request, we request only per pages of 50. So to get to page 3, we need to ask page 12 -> _(200 / 50) * 4 = 12_
     */
    const apiPage = chunksPerPage * clientPage;

    // If items to fetch is less than 100, then we fetch next page in advance
    const fetchCount = settingsPageSize < MailPageSize.ONE_HUNDRED ? chunksPerPage * 2 : chunksPerPage;

    const queryParameters = getQueryElementsParameters({
        page: apiPage,
        pageSize: MAX_MESSAGES_FETCH_CHUNK_SIZE,
        params,
    });

    abortController?.abort();
    const newAbortController = new AbortController();

    const initialPromise = Promise.resolve({
        abortController: newAbortController,
        Total: 0,
        More: true,
        Elements: [],
        Stale: 0,
        TasksRunning: [],
        ...('Anchor' in queryParameters && {
            Anchor: queryParameters.Anchor,
            AnchorID: queryParameters.AnchorID,
        }),
    });

    return range(0, fetchCount).reduce(
        (lastCall: Promise<QueryResults | (QueryResults & { AnchorID: string; Anchor: string })>) => {
            return lastCall.then(async (previousResult) => {
                if (!previousResult.More) {
                    return previousResult;
                }

                const query = conversationMode ? queryConversations : queryMessageMetadata;

                const internalQueryParameters = {
                    ...omit(queryParameters, ['Page', 'PageSize']),
                    Limit: MAX_MESSAGES_FETCH_CHUNK_SIZE,
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
                const lastElement = elements[MAX_MESSAGES_FETCH_CHUNK_SIZE - 1];

                const newElements = [...previousResult.Elements, ...elements];

                return {
                    abortController: newAbortController,
                    More: elements.length >= MAX_MESSAGES_FETCH_CHUNK_SIZE,
                    Total: newElements.length,
                    Elements: newElements,
                    Stale: result.Stale,
                    TasksRunning: result.TasksRunning,
                    ...(lastElement && {
                        AnchorID: lastElement.ID,
                        Anchor: lastElement[queryParameters.Sort ?? 'Time'],
                    }),
                };
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
        ? api({ ...queryConversations(params), signal: newAbortController.signal })
        : api({ ...queryMessageMetadata(params), signal: newAbortController.signal });

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
