import type { CombinedState, ReducersMapObject, StateFromReducersMapObject } from 'redux';
import { combineReducers } from 'redux';

import type { CombinedOptimisticReducer, OptimisticReducersMapObject, OptimisticReducersMapValues } from '../types';
import { isCombinedOptimisticReducer, isOptimisticReducer } from './assertions';

export const getReducerMapEntries = (
    reducersMap: OptimisticReducersMapObject
): [PropertyKey, OptimisticReducersMapValues][] => {
    return Object.entries(reducersMap);
};

/**
 * Calling combineOptimisticReducers will behave exactly like
 * redux's combineReducers but will additionally keep track of
 * the underlying "reducer state structure". This will allow us
 * to access the innerReducer property on "combined optimistic reducers"
 */
export const combineOptimisticReducers = <M extends ReducersMapObject>(reducers: M) => {
    const combinedReducer = combineReducers<M>(reducers);

    const hasWrappedOptimisticReducers = Object.values(reducers).some(
        (reducer) => isOptimisticReducer(reducer) || isCombinedOptimisticReducer(reducer)
    );

    if (hasWrappedOptimisticReducers) {
        (combinedReducer as any).innerCombinedReducers = reducers;
    }

    return combinedReducer as CombinedOptimisticReducer<CombinedState<StateFromReducersMapObject<M>>>;
};
