import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { moveAll as moveAllRequest, queryMessageMetadata } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
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
import {
    getQueryElementsParameters,
    queryElement,
    queryElements,
    refreshTaskRunningTimeout,
} from './helpers/elementQuery';

const REFRESHES = [5, 10, 20];

export const reset = createAction<NewStateParams>('elements/reset');

export const updatePage = createAction<number>('elements/updatePage');

export const retry = createAction<{ queryParameters: any; error: Error | undefined }>('elements/retry');

export const load = createAsyncThunk<
    { result: QueryResults; taskRunning: TaskRunningInfo },
    QueryParams,
    AppThunkExtra
>(
    'elements/load',
    async (
        { page, params, abortController, conversationMode, count = 1 }: QueryParams,
        { dispatch, getState, extra }
    ) => {
        const queryParameters = getQueryElementsParameters({ page, params });
        let result;
        try {
            result = await queryElements(extra.api, abortController, conversationMode, queryParameters);
        } catch (error: any | undefined) {
            // Wait a couple of seconds before retrying
            setTimeout(() => {
                dispatch(retry({ queryParameters, error }));
            }, 2000);
            throw error;
        }
        if (result.Stale === 1 && REFRESHES?.[count]) {
            const ms = 1000 * REFRESHES[count];
            // Wait few seconds before retrying
            setTimeout(() => {
                if (isDeepEqual((getState() as RootState).elements.params, params)) {
                    void dispatch(load({ page, params, abortController, conversationMode, count: count + 1 }));
                }
            }, ms);
        }
        const taskLabels = Object.keys(result.TasksRunning || {});
        const taskRunning = { ...(getState() as RootState).elements.taskRunning };
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
    { SourceLabelID: string; DestinationLabelID: string },
    AppThunkExtra
>('elements/moveAll', async ({ SourceLabelID, DestinationLabelID }, { dispatch, getState, extra }) => {
    // If we move all to trash, we don't want to keep labels attached to the elements
    const isMoveToTrash = SourceLabelID === MAILBOX_LABEL_IDS.TRASH;

    await extra.api(moveAllRequest({ SourceLabelID, DestinationLabelID, KeepSourceLabel: isMoveToTrash ? 0 : 1 }));

    const timeoutID = refreshTaskRunningTimeout([SourceLabelID], {
        getState,
        dispatch,
    });

    return { LabelID: SourceLabelID, timeoutID: timeoutID as NodeJS.Timeout };
});
