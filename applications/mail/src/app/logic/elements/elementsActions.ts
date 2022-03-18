import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import noop from '@proton/utils/noop';
import { Api } from '@proton/shared/lib/interfaces';
import { moveAll as moveAllRequest, queryMessageMetadata } from '@proton/shared/lib/api/messages';
import diff from '@proton/utils/diff';
import {
    ESResults,
    EventUpdates,
    NewStateParams,
    OptimisticDelete,
    OptimisticUpdates,
    QueryParams,
    QueryResults,
} from './elementsTypes';
import { Element } from '../../models/element';
import { getQueryElementsParameters, queryElement, queryElements } from './helpers/elementQuery';
import { RootState } from '../store';

const TASK_RUNNING_POLLING_INTERVAL = 2000;

export const reset = createAction<NewStateParams>('elements/reset');

export const updatePage = createAction<number>('elements/updatePage');

export const retry = createAction<{ queryParameters: any; error: Error | undefined }>('elements/retry');

export const retryStale = createAction<{ queryParameters: any }>('elements/retry/stale');

export const load = createAsyncThunk<QueryResults, QueryParams>(
    'elements/load',
    async (queryParams: QueryParams, { dispatch }) => {
        const queryParameters = getQueryElementsParameters(queryParams);
        let result;
        try {
            result = await queryElements(
                queryParams.api,
                queryParams.abortController,
                queryParams.conversationMode,
                queryParameters
            );
        } catch (error: any | undefined) {
            // Wait a couple of seconds before retrying
            setTimeout(() => {
                dispatch(retry({ queryParameters, error }));
            }, 2000);
            throw error;
        }
        if (result.Stale === 1) {
            const error = new Error('Elements result is stale');
            // Wait a second before retrying
            setTimeout(() => {
                dispatch(retryStale({ queryParameters }));
            }, 1000);
            throw error;
        }
        return result;
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

export const pollTaskRunning = createAsyncThunk<
    { newLabels: string[]; timeoutID: NodeJS.Timeout | undefined },
    { api: Api; call: () => Promise<void> }
>('elements/pollTaskRunning', async ({ api, call }, { dispatch, getState }) => {
    const currentLabels = (getState() as RootState).elements.taskRunning.labelIDs;
    const finishedLabels = [];

    await call();

    for (let label of currentLabels) {
        const result = await api<{ TasksRunning: any }>(queryMessageMetadata({ LabelID: label } as any));
        if (!result.TasksRunning[label]) {
            finishedLabels.push(label);
        }
    }

    const newLabels = diff(currentLabels, finishedLabels);
    let timeoutID: NodeJS.Timeout | undefined = undefined;

    if (newLabels.length > 0) {
        timeoutID = setTimeout(() => {
            void dispatch(pollTaskRunning({ api, call }));
        }, TASK_RUNNING_POLLING_INTERVAL);
    }

    return { newLabels, timeoutID };
});

export const moveAll = createAsyncThunk<
    { LabelID: string; timeoutID: NodeJS.Timeout },
    { api: Api; call: () => Promise<void>; SourceLabelID: string; DestinationLabelID: string }
>('elements/moveAll', async ({ api, call, SourceLabelID, DestinationLabelID }, { dispatch, getState }) => {
    let timeoutID = (getState() as RootState).elements.taskRunning.timeoutID;

    if (timeoutID !== undefined) {
        clearTimeout(timeoutID);
    }

    await api(moveAllRequest({ SourceLabelID, DestinationLabelID }));

    timeoutID = setTimeout(() => {
        void dispatch(pollTaskRunning({ api, call }));
    }, TASK_RUNNING_POLLING_INTERVAL);

    return { LabelID: SourceLabelID, timeoutID };
});
