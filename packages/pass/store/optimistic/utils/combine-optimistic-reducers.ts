import type { ReducersMapObject, StateFromReducersMapObject } from 'redux';
import { combineReducers } from 'redux';

import { or } from '@proton/pass/utils/fp/predicates';

import type { CombinedOptimisticReducer, OptimisticReducersMapObject, OptimisticReducersMapValues } from '../types';
import { isCombinedOptimisticReducer, isOptimisticReducer } from './assertions';

export const getReducerMapEntries = (
    reducersMap: OptimisticReducersMapObject
): [PropertyKey, OptimisticReducersMapValues][] => {
    return Object.entries(reducersMap);
};

/** Calling `combineOptimisticReducers` will behave exactly like
 * redux's combineReducers but will additionally keep track of
 * the underlying "reducer state structure". This will allow us
 * to access the innerReducer property on "combined optimistic reducers" */
export const combineOptimisticReducers = <M extends ReducersMapObject>(reducerMap: M) => {
    const reducers = Object.values(reducerMap);
    const combinedReducer = combineReducers<M>(reducerMap) as unknown;

    const hasWrappedOptimisticReducers = reducers.some(or(isOptimisticReducer, isCombinedOptimisticReducer));
    if (hasWrappedOptimisticReducers) (combinedReducer as any).innerCombinedReducers = reducerMap;

    return combinedReducer as CombinedOptimisticReducer<StateFromReducersMapObject<M>>;
};
