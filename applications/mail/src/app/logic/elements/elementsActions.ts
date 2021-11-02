import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { noop } from '@proton/shared/lib/helpers/function';
import {
    ESResults,
    EventUpdates,
    NewStateParams,
    OptimisticDelete,
    OptimisticUpdates,
    QueryParams,
    QueryResults,
    RetryData,
} from './elementsTypes';
import { Element } from '../../models/element';
import { getQueryElementsParameters, newRetry, queryElement, queryElements } from './helpers/elementQuery';
import { RootState } from '../store';

export const reset = createAction<NewStateParams>('elements/reset');

export const updatePage = createAction<number>('elements/updatePage');

export const retry = createAction<RetryData>('elements/retry');

export const load = createAsyncThunk<QueryResults, QueryParams>(
    'elements/load',
    async (queryParams: QueryParams, { getState, dispatch }) => {
        const queryParameters = getQueryElementsParameters(queryParams);
        try {
            return await queryElements(
                queryParams.api,
                queryParams.abortController,
                queryParams.conversationMode,
                queryParameters
            );
        } catch (error: any | undefined) {
            // Wait a couple of seconds before retrying
            setTimeout(() => {
                const currentRetry = (getState() as RootState).elements.retry;
                dispatch(retry(newRetry(currentRetry, queryParameters, error)));
            }, 2000);
            throw error;
        }
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
