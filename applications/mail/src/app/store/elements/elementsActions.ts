import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import {
    labelAll as labelAllRequest,
    markAllMessagesAsRead,
    markAllMessagesAsUnread,
    moveAllBatch,
    queryMessageMetadata,
} from '@proton/shared/lib/api/messages';
import { DEFAULT_MAIL_PAGE_SIZE, SECOND } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import diff from '@proton/utils/diff';
import unique from '@proton/utils/unique';

import { isElementMessage } from 'proton-mail/helpers/elements';

import type { Element } from '../../models/element';
import type { MailState, MailThunkExtra } from '../store';
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
import { queryElement, queryElementsInBatch, refreshTaskRunningTimeout } from './helpers/elementQuery';

const REFRESHES = [5, 10, 20];

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

        const onSerializedResponse = ({ result, page }: { result: QueryResults; page: number }) => {
            dispatch(
                showSerializedElements({
                    result,
                    page,
                    params,
                })
            );
        };

        const disabledCategoriesIDs = selectDisabledCategoriesIDs(state);
        const result = await queryElementsInBatch(
            {
                api: extra.api,
                page,
                pageSize,
                params,
                abortController,
                disabledCategoriesIDs,
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
                void dispatch(
                    load({
                        page,
                        pageSize,
                        abortController,
                        count: count + 1,
                        refetch: true, // Do not update current page if we refetch,
                    })
                );
            }, ms);
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

export const optimisticApplyLabels = createAction<OptimisticUpdates>('elements/optimistic/applyLabels');

export const optimisticDelete = createAction<OptimisticDelete>('elements/optimistic/delete');

export const optimisticRestoreDelete = createAction<OptimisticUpdates>('elements/optimistic/restoreDelete');

export const optimisticEmptyLabel = createAction<void>('elements/optimistic/emptyLabel');

export const optimisticRestoreEmptyLabel = createAction<OptimisticUpdates>('elements/optimistic/restoreEmptyLabel');

export const optimisticMarkAs = createAction<OptimisticUpdates>('elements/optimistic/markAs');

export const backendActionStarted = createAction<void>('elements/action/started');

export const backendActionFinished = createAction<void>('elements/action/finished');

export const pollTaskRunning = createAsyncThunk<TaskRunningInfo, undefined, MailThunkExtra>(
    'elements/pollTaskRunning',
    async (_, { dispatch, getState, extra }) => {
        const currentLabels = (getState() as MailState).elements.taskRunning.labelIDs;
        const finishedLabels = [];

        for (const label of currentLabels) {
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
    { LabelID?: string; timeoutID?: NodeJS.Timeout },
    { SourceLabelID: string; DestinationLabelID: string },
    MailThunkExtra
>('elements/moveAll', async ({ SourceLabelID, DestinationLabelID }, { dispatch, getState, extra }) => {
    try {
        // Reset element state when doing a select all so that the user can see the task running banner when going
        // to cached locations, and starts with a clean Redux state.
        const state = (getState() as MailState).elements;
        dispatch(reset({ params: state.params }));

        await extra.api(
            moveAllBatch({
                SearchContext: {
                    LabelID: SourceLabelID,
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

export const markAll = createAsyncThunk<
    { LabelID?: string; timeoutID?: NodeJS.Timeout },
    { SourceLabelID: string; status: MARK_AS_STATUS },
    MailThunkExtra
>('elements/markAll', async ({ SourceLabelID, status }, { dispatch, getState, extra }) => {
    const action = status === MARK_AS_STATUS.READ ? markAllMessagesAsRead : markAllMessagesAsUnread;

    try {
        // Reset element state when doing a select all so that the user can see the task running banner when going
        // to cached locations, and starts with a clean Redux state.
        const state = (getState() as MailState).elements;
        dispatch(reset({ params: state.params }));

        await extra.api(
            action({
                SearchContext: {
                    LabelID: SourceLabelID,
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
