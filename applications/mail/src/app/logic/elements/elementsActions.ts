import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { moveAll as moveAllRequest, queryMessageMetadata } from '@proton/shared/lib/api/messages';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { Api } from '@proton/shared/lib/interfaces';
import diff from '@proton/utils/diff';
import noop from '@proton/utils/noop';
import unique from '@proton/utils/unique';

import { Element } from '../../models/element';
import { RootState } from '../store';
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

export const load = createAsyncThunk<{ result: QueryResults; taskRunning: TaskRunningInfo }, QueryParams>(
    'elements/load',
    async (
        { api, call, page, params, abortController, conversationMode, count = 1 }: QueryParams,
        { dispatch, getState }
    ) => {
        const queryParameters = getQueryElementsParameters({ page, params });
        let result;
        try {
            result = await queryElements(api, abortController, conversationMode, queryParameters);
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
                    void dispatch(
                        load({ api, call, page, params, abortController, conversationMode, count: count + 1 })
                    );
                }
            }, ms);
        }
        const taskLabels = Object.keys(result.TasksRunning || {});
        const taskRunning = { ...(getState() as RootState).elements.taskRunning };
        if (taskLabels.length) {
            taskRunning.labelIDs = unique([...taskRunning.labelIDs, ...taskLabels]);
            taskRunning.timeoutID = refreshTaskRunningTimeout(taskRunning.labelIDs, { getState, api, dispatch, call });
        }
        return { result, taskRunning };
    }
);

export const removeExpired = createAction<Element>('elements/removeExpired');

export const invalidate = createAction<void>('elements/invalidate');

export const eventUpdates = createAsyncThunk<(Element | undefined)[], EventUpdates>(
    'elements/eventUpdates',
    async ({ api, conversationMode, toLoad }) => {
        return Promise.all(toLoad.map(async (elementID) => queryElement(api, conversationMode, elementID).catch(noop)));
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

export const pollTaskRunning = createAsyncThunk<TaskRunningInfo, { api: Api; call: () => Promise<void> }>(
    'elements/pollTaskRunning',
    async ({ api, call }, { dispatch, getState }) => {
        await call();

        const currentLabels = (getState() as RootState).elements.taskRunning.labelIDs;
        const finishedLabels = [];

        for (let label of currentLabels) {
            const result = await api<QueryResults>(queryMessageMetadata({ LabelID: label } as any));
            const isLabelStillRunning =
                result?.TasksRunning && !Array.isArray(result.TasksRunning) && result.TasksRunning[label];

            if (!isLabelStillRunning) {
                finishedLabels.push(label);
            }
        }

        const labelIDs = diff(currentLabels, finishedLabels);

        const timeoutID = refreshTaskRunningTimeout(labelIDs, { getState, api, dispatch, call });

        return { labelIDs, timeoutID };
    }
);

export const moveAll = createAsyncThunk<
    { LabelID: string; timeoutID: NodeJS.Timeout },
    { api: Api; call: () => Promise<void>; SourceLabelID: string; DestinationLabelID: string }
>('elements/moveAll', async ({ api, call, SourceLabelID, DestinationLabelID }, { dispatch, getState }) => {
    await api(moveAllRequest({ SourceLabelID, DestinationLabelID }));

    const timeoutID = refreshTaskRunningTimeout([SourceLabelID], { getState, api, dispatch, call });

    return { LabelID: SourceLabelID, timeoutID: timeoutID as NodeJS.Timeout };
});
