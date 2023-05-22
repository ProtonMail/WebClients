import type { AnyAction } from 'redux';

import type { HistoryItem, OptimisticReducersMapObject, WrappedOptimisticState } from '../types';
import { isCombinedOptimisticReducer } from './assertions';

export const unwrapOptimisticState = <T>(state: WrappedOptimisticState<T>): T => {
    const { optimistic, ...inner } = state;

    /*
     * TS: 'T' could be instantiated with an arbitrary type which could be unrelated to
     * 'Omit<WrappedOptimisticState<T>, "optimistic">'
     *
     * Impossible, since WrappedOptimisticState<T> is 'T & { optimistic: {...} }'
     */
    return inner as any as T;
};

/* Unwraps the underlying actionfrom an OptimisticHistoryItem */
export const getActionFromHistoryItem = (item: HistoryItem): AnyAction => item.action;

/**
 * Sanitizes an optimistic reducer map object by recursively
 * unwrapping any combined optimistic reducer into a sub-map
 * of the inner reducers (see combineOptimisticReducers)
 */
export const sanitizeOptimisticReducerMapObject = (map: OptimisticReducersMapObject): OptimisticReducersMapObject => {
    return Object.fromEntries(
        Object.entries(map).map(([reducerKey, reducer]) => {
            if (
                typeof reducer === 'function' &&
                isCombinedOptimisticReducer(reducer) &&
                reducer.innerCombinedReducers !== undefined
            ) {
                return [reducerKey, sanitizeOptimisticReducerMapObject(reducer.innerCombinedReducers)];
            }

            return [reducerKey, reducer];
        })
    );
};
