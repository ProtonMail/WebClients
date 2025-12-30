import type { Selector } from '@reduxjs/toolkit';

import isDeepEqual from 'lodash/isEqual';

import type {
    MaybeOptimisticStateObject,
    OptimisticReducersMapObject,
    StateFromOptimisticReducersMapObject,
    WithOptimisticReducer,
    WrappedOptimisticState,
} from '../types';
import { isOptimisticReducer, isOptimisticState } from '../utils/assertions';
import { getReducerMapEntries } from '../utils/combine-optimistic-reducers';
import getWithoutOptimistic from '../utils/get-without-optimistic';
import { sanitizeOptimisticReducerMapObject } from '../utils/transformers';

export const asIfNotOptimistic = <T extends {}, M extends OptimisticReducersMapObject<T>>(
    state: T,
    reducerMap: M
): StateFromOptimisticReducersMapObject<M> => {
    const entries = getReducerMapEntries(sanitizeOptimisticReducerMapObject(reducerMap));

    const stateWithOptimistics = state as MaybeOptimisticStateObject;
    const newState = {} as any;

    for (const [name, maybeReducer] of entries) {
        const subState = stateWithOptimistics[name];

        if (typeof maybeReducer === 'function') {
            if (isOptimisticState(subState) && isOptimisticReducer(maybeReducer)) {
                newState[name] = getWithoutOptimistic(subState, maybeReducer);
            } else {
                newState[name] = subState;
            }
        } else {
            newState[name] = asIfNotOptimistic(subState, maybeReducer);
        }
    }

    return newState;
};

export const asIfNotOptimisticSubSelector =
    <T extends {}, Optimistics extends WrappedOptimisticState<T>>(reducer: WithOptimisticReducer<T>) =>
    (subState: Optimistics) =>
        getWithoutOptimistic(subState, reducer);

const selectIsOptimistic =
    <T extends object>(state: T) =>
    <M extends OptimisticReducersMapObject<T>>(reducerMap: M) =>
    (selector: Selector<StateFromOptimisticReducersMapObject<M>>): boolean => {
        const stateWithoutOptimistic = selector(asIfNotOptimistic(state, reducerMap));
        const stateWithOptimistic = selector(state as StateFromOptimisticReducersMapObject<M>);

        return !isDeepEqual(stateWithOptimistic, stateWithoutOptimistic);
    };

export default selectIsOptimistic;
