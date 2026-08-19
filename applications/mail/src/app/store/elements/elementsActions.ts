import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { getConversation } from '@proton/shared/lib/api/conversations';
import {
    labelAll as labelAllRequest,
    markAllMessagesAsRead,
    markAllMessagesAsUnread,
    moveAllBatch,
} from '@proton/shared/lib/api/messages';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { DEFAULT_MAIL_PAGE_SIZE, MAILBOX_LABEL_IDS, SECOND } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import unique from '@proton/utils/unique';

import { isElementMessage } from '../../helpers/elements';

import type { Element } from '../../models/element';
import type { ConversationParams, ConversationResult } from '../conversations/conversationsTypes';
import type { MailState, MailThunkExtra } from '../store';
import { selectCurrentContextIdentifier } from './elementsSelectors';
import { refreshTaskRunningTimeout } from './elementsTaskRunning';
import type {
    ESResults,
    ElementsStateParams,
    EventUpdates,
    NewStateParams,
    OptimisticDelete,
    OptimisticUpdates,
    QueryParams,
    QueryResults,
    TaskRunningInfo,
} from './elementsTypes';
import { PAGE_FETCH_COUNT, queryElement, queryElementsInBatch } from './helpers/elementQuery';

const REFRESHES = [5, 10, 20];
// Backend search re-indexing after an action (e.g. delete) is typically much faster than
// the eventual-consistency delay for regular folder counts, so we can retry sooner.
const SEARCH_REFRESHES = [1, 2, 4];

// Safety cap on how many extra anchor-paginated batches we fetch in one go, even if a very
// large number of elements were deleted, to avoid firing an excessive number of requests.
const MAX_SEARCH_PAGE_FETCH_COUNT = 5;

/**
 * When reloading a backend search after a bulk delete, the default `PAGE_FETCH_COUNT` might not be
 * enough to backfill every page affected by the deletion in a single round trip. Scale the number of
 * batches fetched based on how many elements were actually removed since the last successful load.
 */
const getPageFetchCount = ({
    isSearching,
    pageSize,
    deletedSinceLastLoad,
}: {
    isSearching: boolean;
    pageSize: number;
    deletedSinceLastLoad: number;
}) => {
    if (!isSearching || deletedSinceLastLoad <= 0) {
        return PAGE_FETCH_COUNT;
    }

    const pagesToBackfill = Math.ceil(deletedSinceLastLoad / pageSize);

    return Math.min(MAX_SEARCH_PAGE_FETCH_COUNT, Math.max(PAGE_FETCH_COUNT, pagesToBackfill));
};

export const reset = createAction<NewStateParams>('elements/reset');

export const updatePage = createAction<number>('elements/updatePage');

export const setParams = createAction<Partial<ElementsStateParams> & { total?: number }>('elements/setParams');

export const retry = createAction<{
    queryParameters: unknown;
    error: Error | undefined;
}>('elements/retry');

export const showSerializedElements = createAction<{
    result: QueryResults;
    page: number;
    params: ElementsStateParams;
}>('elements/showSerializedElements');

export const load = createAsyncThunk<
    { result: QueryResults; taskRunning: TaskRunningInfo; params: ElementsStateParams },
    QueryParams,
    MailThunkExtra
>(
    'elements/load',
    async (
        { page, pageSize = DEFAULT_MAIL_PAGE_SIZE, abortController, count = 1 }: QueryParams,
        { dispatch, getState, extra }
    ) => {
        const state = getState() as MailState;
        const params = state.elements.params;

        const currentContextIdentifier = selectCurrentContextIdentifier(state);

        // Indicates that we have a context, the location was already loaded
        const contextAlreadyPresent = !!state.elements.total[currentContextIdentifier];

        const pageFetchCount = getPageFetchCount({
            isSearching: params.isSearching,
            pageSize,
            deletedSinceLastLoad: state.elements.deletedSinceLastLoad,
        });

        const onSerializedResponse = ({ result, page }: { result: QueryResults; page: number }) => {
            dispatch(
                showSerializedElements({
                    result,
                    page,
                    params,
                })
            );
        };

        const result = await queryElementsInBatch(
            {
                api: extra.api,
                page,
                pageSize,
                params,
                abortController,
                pageFetchCount,
            },
            onSerializedResponse
        ).catch((error: any | undefined) => {
            // Wait a couple of seconds before retrying
            setTimeout(() => {
                dispatch(
                    retry({
                        queryParameters: {
                            page,
                            pageSize,
                            params,
                        },
                        error,
                    })
                );
            }, 2 * SECOND);

            throw error;
        });

        if (result.Stale === 1) {
            const refreshes = params.isSearching ? SEARCH_REFRESHES : REFRESHES;
            const refreshDelay = contextAlreadyPresent
                ? refreshes[Math.min(count, refreshes.length - 1)]
                : refreshes?.[count];

            if (refreshDelay !== undefined) {
                setTimeout(() => {
                    void dispatch(
                        load({
                            page,
                            pageSize,
                            abortController,
                            count: count + 1,
                            refetch: true, // Do not update current page if we refetch,
                        })
                    );
                }, refreshDelay * SECOND);
            }
        }

        const taskLabels = Object.keys(result.TasksRunning || {});
        const taskRunning = {
            ...state.elements.taskRunning,
        };

        if (taskLabels.length) {
            taskRunning.labelIDs = unique([...taskRunning.labelIDs, ...taskLabels]);
            taskRunning.timeoutID = refreshTaskRunningTimeout(taskRunning.labelIDs, {
                getState,
                dispatch,
            });
        }

        return { result, taskRunning, params };
    }
);

export const removeExpired = createAction<Element>('elements/removeExpired');

export const invalidate = createAction<void>('elements/invalidate');

export const eventUpdates = createAsyncThunk<(Element | undefined)[], EventUpdates, MailThunkExtra>(
    'elements/eventUpdates',
    async ({ toLoad }, thunkApi) => {
        return Promise.all(
            toLoad.map(async (element) =>
                // We tried to use the isMessage instead of converation mode to avoid relying on current labelID settings
                queryElement(thunkApi.extra.api, isElementMessage(element), element.ID).catch(() => element)
            )
        );
    }
);

export const manualPending = createAction<void>('elements/manualPending');

export const manualFulfilled = createAction<void>('elements/manualFulfilled');

export const addESResults = createAction<ESResults>('elements/addESResults');

export const esSearchStarted = createAction<void>('elements/esSearchStarted');

export const esSearchSettled = createAction<void>('elements/esSearchSettled');

export const optimisticApplyLabels = createAction<OptimisticUpdates>('elements/optimistic/applyLabels');

export const optimisticDelete = createAction<OptimisticDelete>('elements/optimistic/delete');

export const optimisticRestoreDelete = createAction<OptimisticUpdates>('elements/optimistic/restoreDelete');

export const optimisticEmptyLabel = createAction<void>('elements/optimistic/emptyLabel');

export const optimisticRestoreEmptyLabel = createAction<OptimisticUpdates>('elements/optimistic/restoreEmptyLabel');

export const optimisticMarkAs = createAction<OptimisticUpdates>('elements/optimistic/markAs');

export const backendActionStarted = createAction<void>('elements/action/started');

export const backendActionFinished = createAction<void>('elements/action/finished');

export { pollTaskRunning } from './elementsTaskRunning';

export const moveAll = createAsyncThunk<
    { LabelID?: string; timeoutID?: NodeJS.Timeout },
    { SourceLabelID: string; DestinationLabelID: string },
    MailThunkExtra
>('elements/moveAll', async ({ SourceLabelID, DestinationLabelID }, { dispatch, getState, extra }) => {
    try {
        // Reset element state when doing a select all so that the user can see the task running banner when going
        // to cached locations, and starts with a clean Redux state.
        const state = (getState() as MailState).elements;
        dispatch(reset({ params: state.params }));

        const categoryIDs = state.params.categoryIDs;
        const labels =
            SourceLabelID === MAILBOX_LABEL_IDS.INBOX && categoryIDs.length > 0
                ? [SourceLabelID, ...categoryIDs]
                : [SourceLabelID];

        await extra.api(
            moveAllBatch({
                SearchContext: {
                    LabelIDs: labels,
                },
                DestinationLabelID,
            })
        );
    } catch {
        // Once the action is done, we can remove the pending action, and since we know what are the task running,
        // there should be no elements loaded in the location for the time a task is running
        dispatch(backendActionFinished());

        extra.notificationManager.clearNotifications();
        extra.notificationManager.createNotification({
            type: 'error',
            text: c('Error').t`Something went wrong. Please try again.`,
        });

        return {
            LabelID: undefined,
            timeoutID: undefined,
        };
    }

    // Once the action is done, we can remove the pending action, and since we know what are the task running,
    // there should be no elements loaded in the location for the time a task is running
    dispatch(backendActionFinished());

    const timeoutID = refreshTaskRunningTimeout([SourceLabelID], {
        getState,
        dispatch,
    });

    return {
        LabelID: SourceLabelID,
        timeoutID: timeoutID as NodeJS.Timeout,
    };
});

type MarkAllParams = {
    SourceLabelID: string;
    status: MARK_AS_STATUS;
    /** Omit to inherit the list's current categories; `[]` scopes to the whole Inbox. */
    categoryIDs?: CategoryLabelID[];
};

export const markAll = createAsyncThunk<
    { LabelID?: string; timeoutID?: NodeJS.Timeout },
    MarkAllParams,
    MailThunkExtra
>('elements/markAll', async ({ SourceLabelID, status, categoryIDs }, { dispatch, getState, extra }) => {
    const action = status === MARK_AS_STATUS.READ ? markAllMessagesAsRead : markAllMessagesAsUnread;

    try {
        // Reset element state when doing a select all so that the user can see the task running banner when going
        // to cached locations, and starts with a clean Redux state.
        const state = (getState() as MailState).elements;
        dispatch(reset({ params: state.params }));

        const scopedCategoryIDs = categoryIDs ?? state.params.categoryIDs;
        const labels =
            SourceLabelID === MAILBOX_LABEL_IDS.INBOX && scopedCategoryIDs.length > 0
                ? [SourceLabelID, ...scopedCategoryIDs]
                : [SourceLabelID];

        await extra.api(
            action({
                SearchContext: {
                    LabelIDs: labels,
                },
            })
        );
    } catch {
        // Once the action is done, we can remove the pending action, and since we know what are the task running,
        // there should be no elements loaded in the location for the time a task is running
        dispatch(backendActionFinished());

        extra.notificationManager.clearNotifications();
        extra.notificationManager.createNotification({
            type: 'error',
            text: c('Error').t`Something went wrong. Please try again.`,
        });

        return {
            LabelID: undefined,
            timeoutID: undefined,
        };
    }

    // Once the action is done, we can remove the pending action, and since we know what are the task running,
    // there should be no elements loaded in the location for the time a task is running
    dispatch(backendActionFinished());

    const timeoutID = refreshTaskRunningTimeout([SourceLabelID], {
        getState,
        dispatch,
    });

    return {
        LabelID: SourceLabelID,
        timeoutID: timeoutID as NodeJS.Timeout,
    };
});

export const labelAll = createAsyncThunk<
    { LabelID?: string; timeoutID?: NodeJS.Timeout },
    { SourceLabelID: string; toLabel: string[]; toUnlabel: string[] },
    MailThunkExtra
>('elements/markAll', async ({ SourceLabelID, toLabel, toUnlabel }, { dispatch, getState, extra }) => {
    try {
        // Reset element state when doing a select all so that the user can see the task running banner when going
        // to cached locations, and starts with a clean Redux state.
        const state = (getState() as MailState).elements;
        dispatch(reset({ params: state.params }));

        const categoryIDs = state.params.categoryIDs;
        const labels =
            SourceLabelID === MAILBOX_LABEL_IDS.INBOX && categoryIDs.length > 0
                ? [SourceLabelID, ...categoryIDs]
                : [SourceLabelID];

        await extra.api(
            labelAllRequest({
                SearchContext: {
                    LabelIDs: labels,
                },
                AddLabelIDs: toLabel,
                RemoveLabelIDs: toUnlabel,
            })
        );
    } catch {
        // Once the action is done, we can remove the pending action, and since we know what are the task running,
        // there should be no elements loaded in the location for the time a task is running
        dispatch(backendActionFinished());

        extra.notificationManager.clearNotifications();
        extra.notificationManager.createNotification({
            type: 'error',
            text: c('Error').t`Something went wrong. Please try again.`,
        });

        return {
            LabelID: undefined,
            timeoutID: undefined,
        };
    }

    // Once the action is done, we can remove the pending action, and since we know what are the task running,
    // there should be no elements loaded in the location for the time a task is running
    dispatch(backendActionFinished());

    const timeoutID = refreshTaskRunningTimeout([SourceLabelID], {
        getState,
        dispatch,
    });

    return {
        LabelID: SourceLabelID,
        timeoutID: timeoutID as NodeJS.Timeout,
    };
});

export const resetRetry = createAction<void>('elements/resetRetry');

export const loadConversation = createAsyncThunk<ConversationResult, ConversationParams, MailThunkExtra>(
    'conversations/load',
    async ({ silentFetch = false, conversationID, messageID }, thunkApi) => {
        try {
            return await thunkApi.extra.api({ ...getConversation(conversationID, messageID), silent: silentFetch });
        } catch (error: any | undefined) {
            console.error(error);
            throw error;
        }
    }
);
