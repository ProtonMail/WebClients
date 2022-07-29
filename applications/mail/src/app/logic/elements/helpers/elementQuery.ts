import { getConversation, queryConversations } from '@proton/shared/lib/api/conversations';
import { getMessage, queryMessageMetadata } from '@proton/shared/lib/api/messages';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { Api } from '@proton/shared/lib/interfaces';

import { ELEMENTS_CACHE_REQUEST_SIZE, PAGE_SIZE } from '../../../constants';
import { Element } from '../../../models/element';
import { RootState } from '../../store';
import { pollTaskRunning } from '../elementsActions';
import { QueryParams, QueryResults, RetryData } from '../elementsTypes';

export const TASK_RUNNING_POLLING_INTERVAL = 2000;

export const getQueryElementsParameters = ({
    page,
    params: { labelID, sort, search, filter },
}: Pick<QueryParams, 'page' | 'params'>): any => ({
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

export const queryElements = async (
    api: Api,
    abortController: AbortController | undefined,
    conversationMode: boolean,
    payload: QueryParams
): Promise<QueryResults> => {
    abortController?.abort();
    const newAbortController = new AbortController();
    const query = conversationMode ? queryConversations : queryMessageMetadata;

    const result: any = await api({ ...query(payload as any), signal: newAbortController.signal });

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
export const newRetry = (retry: RetryData, payload: any, error: Error | undefined) => {
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
    {
        getState,
        api,
        dispatch,
        call,
    }: { getState: () => unknown; api: Api; dispatch: (action: any) => void; call: () => Promise<void> }
): NodeJS.Timeout | undefined => {
    let timeoutID: NodeJS.Timeout | undefined = (getState() as RootState).elements.taskRunning.timeoutID;

    if (timeoutID) {
        clearTimeout(timeoutID);
        timeoutID = undefined;
    }

    if (newLabelIDs.length > 0) {
        timeoutID = setTimeout(() => {
            void dispatch(pollTaskRunning({ api, call }));
        }, TASK_RUNNING_POLLING_INTERVAL);
    }

    return timeoutID;
};
