import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import {
    labelAll as labelAllRequest,
    markAllMessagesAsRead,
    markAllMessagesAsUnread,
    moveAllBatch,
    moveAll as moveAllRequest,
    queryMessageMetadata,
} from '@proton/shared/lib/api/messages';
import { DEFAULT_MAIL_PAGE_SIZE, MAILBOX_LABEL_IDS, SECOND } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import diff from '@proton/utils/diff';
import unique from '@proton/utils/unique';

import { Element } from '../../models/element';
import { AppThunkExtra, RootState } from '../store';
import {
    ESResults,
    EventUpdates,
    NewStateParams,
    OptimisticDelete,
    OptimisticUpdates,
    QueryParams,
    QueryResults,
    TaskRunningInfo,
} from './elementsTypes';
import { queryElement, queryElementsInBatch, refreshTaskRunningTimeout } from './helpers/elementQuery';

const REFRESHES = [5, 10, 20];

export const reset = createAction<NewStateParams>('elements/reset');

export const updatePage = createAction<number>('elements/updatePage');

export const setPageSize = createAction<number>('elements/setPageSize');

export const retry = createAction<{
    queryParameters: unknown;
    error: Error | undefined;
}>('elements/retry');

export const showSerializedElements = createAction<{
    queryIndex: number;
    result: QueryResults;
    page: number;
}>('elements/showSerializedElements');

export const load = createAsyncThunk<
    { result: QueryResults; taskRunning: TaskRunningInfo },
    QueryParams,
    AppThunkExtra
>(
    'elements/load',
    async (
        { page, pageSize = DEFAULT_MAIL_PAGE_SIZE, params, abortController, count = 1 }: QueryParams,
        { dispatch, getState, extra }
    ) => {
        const onSerializedResponse = ({
            index,
            result,
            page,
        }: {
            index: number;
            result: QueryResults;
            page: number;
        }) => {
            dispatch(
                showSerializedElements({
                    queryIndex: index,
                    result,
                    page,
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

        if (result.Stale === 1 && REFRESHES?.[count]) {
            const ms = 1 * SECOND * REFRESHES[count];

            // Wait few seconds before retrying
            setTimeout(() => {
                if (isDeepEqual((getState() as RootState).elements.params, params)) {
                    void dispatch(
                        load({
                            page,
                            pageSize,
                            params,
                            abortController,
                            count: count + 1,
                            refetch: true, // Do not update current page if we refetch
                        })
                    );
                }
            }, ms);
        }

        const taskLabels = Object.keys(result.TasksRunning || {});
        const taskRunning = {
            ...(getState() as RootState).elements.taskRunning,
        };

        if (taskLabels.length) {
            taskRunning.labelIDs = unique([...taskRunning.labelIDs, ...taskLabels]);
            taskRunning.timeoutID = refreshTaskRunningTimeout(taskRunning.labelIDs, {
                getState,
                dispatch,
            });
        }

        return { result, taskRunning };
    }
);

export const removeExpired = createAction<Element>('elements/removeExpired');

export const invalidate = createAction<void>('elements/invalidate');

export const eventUpdates = createAsyncThunk<(Element | undefined)[], EventUpdates, AppThunkExtra>(
    'elements/eventUpdates',
    async ({ conversationMode, toLoad }, thunkApi) => {
        return Promise.all(
            toLoad.map(async (element) =>
                queryElement(thunkApi.extra.api, conversationMode, element.ID).catch(() => element)
            )
        );
    }
);

export const manualPending = createAction<void>('elements/manualPending');

export const manualFulfilled = createAction<void>('elements/manualFulfilled');

export const addESResults = createAction<ESResults>('elements/addESResults');

export const optimisticApplyLabels = createAction<OptimisticUpdates>('elements/optimistic/applyLabels');

export const optimisticDelete = createAction<OptimisticDelete>('elements/optimistic/delete');

export const optimisticRestoreDelete = createAction<OptimisticUpdates>('elements/optimistic/restoreDelete');

export const optimisticEmptyLabel = createAction<void>('elements/optimistic/emptyLabel');

export const optimisticRestoreEmptyLabel = createAction<OptimisticUpdates>('elements/optimistic/restoreEmptyLabel');

export const optimisticMarkAs = createAction<OptimisticUpdates>('elements/optimistic/markAs');

export const backendActionStarted = createAction<void>('elements/action/started');

export const backendActionFinished = createAction<void>('elements/action/finished');

export const pollTaskRunning = createAsyncThunk<TaskRunningInfo, undefined, AppThunkExtra>(
    'elements/pollTaskRunning',
    async (_, { dispatch, getState, extra }) => {
        await extra.eventManager.call();

        const currentLabels = (getState() as RootState).elements.taskRunning.labelIDs;
        const finishedLabels = [];

        for (let label of currentLabels) {
            const result = await extra.api<QueryResults>(queryMessageMetadata({ LabelID: label }));
            const isLabelStillRunning =
                result?.TasksRunning && !Array.isArray(result.TasksRunning) && result.TasksRunning[label];

            if (!isLabelStillRunning) {
                finishedLabels.push(label);
            }
        }

        const labelIDs = diff(currentLabels, finishedLabels);

        const timeoutID = refreshTaskRunningTimeout(labelIDs, {
            getState,
            dispatch,
        });

        return { labelIDs, timeoutID };
    }
);

export const moveAll = createAsyncThunk<
    { LabelID: string; timeoutID: NodeJS.Timeout },
    { SourceLabelID: string; DestinationLabelID: string; selectAll?: boolean; rollback?: (() => void) | undefined },
    AppThunkExtra
>(
    'elements/moveAll',
    async ({ SourceLabelID, DestinationLabelID, selectAll, rollback }, { dispatch, getState, extra }) => {
        // If we move all to trash, we don't want to keep labels attached to the elements
        const isMoveToTrash = SourceLabelID === MAILBOX_LABEL_IDS.TRASH;

        if (selectAll) {
            try {
                await extra.api(
                    moveAllBatch({
                        SearchContext: {
                            LabelID: SourceLabelID,
                        },
                        DestinationLabelID,
                    })
                );
            } catch {
                rollback?.();
            } finally {
                // Once the action is done, we can remove the pending action, and since we know what are the task running,
                // there should be no elements loaded in the location for the time a task is running
                dispatch(backendActionFinished());
            }
        } else {
            await extra.api(
                moveAllRequest({
                    SourceLabelID,
                    DestinationLabelID,
                    KeepSourceLabel: isMoveToTrash ? 0 : 1,
                })
            );
        }

        const timeoutID = refreshTaskRunningTimeout([SourceLabelID], {
            getState,
            dispatch,
        });

        return {
            LabelID: SourceLabelID,
            timeoutID: timeoutID as NodeJS.Timeout,
        };
    }
);

export const markAll = createAsyncThunk<
    { LabelID: string; timeoutID: NodeJS.Timeout },
    { SourceLabelID: string; status: MARK_AS_STATUS; rollback?: () => void },
    AppThunkExtra
>('elements/markAll', async ({ SourceLabelID, status, rollback }, { dispatch, getState, extra }) => {
    const action = status === MARK_AS_STATUS.READ ? markAllMessagesAsRead : markAllMessagesAsUnread;

    try {
        await extra.api(
            action({
                SearchContext: {
                    LabelID: SourceLabelID,
                },
            })
        );
    } catch {
        rollback?.();
    } finally {
        // Once the action is done, we can remove the pending action, and since we know what are the task running,
        // there should be no elements loaded in the location for the time a task is running
        dispatch(backendActionFinished());
    }

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
    { LabelID: string; timeoutID: NodeJS.Timeout },
    { SourceLabelID: string; toLabel: string[]; toUnlabel: string[]; rollback?: () => void },
    AppThunkExtra
>('elements/markAll', async ({ SourceLabelID, toLabel, toUnlabel, rollback }, { dispatch, getState, extra }) => {
    try {
        await extra.api(
            labelAllRequest({
                SearchContext: {
                    LabelID: SourceLabelID,
                },
                AddLabelIDs: toLabel,
                RemoveLabelIDs: toUnlabel,
            })
        );
    } catch {
        rollback?.();
    } finally {
        // Once the action is done, we can remove the pending action, and since we know what are the task running,
        // there should be no elements loaded in the location for the time a task is running
        dispatch(backendActionFinished());
    }

    const timeoutID = refreshTaskRunningTimeout([SourceLabelID], {
        getState,
        dispatch,
    });

    return {
        LabelID: SourceLabelID,
        timeoutID: timeoutID as NodeJS.Timeout,
    };
});
