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
import getWithoutFailed from '../utils/get-without-failed';
import { sanitizeOptimisticReducerMapObject } from '../utils/transformers';

export const asIfNotFailed = <T extends {}, M extends OptimisticReducersMapObject<T>>(
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
                newState[name] = getWithoutFailed(subState, maybeReducer);
            } else {
                newState[name] = subState;
            }
        } else {
            newState[name] = asIfNotFailed(subState, maybeReducer);
        }
    }

    return newState;
};

export const asIfNotFailedSubSelector =
    <T extends {}, Optimistics extends WrappedOptimisticState<T>>(reducer: WithOptimisticReducer<T>) =>
    (subState: Optimistics) =>
        getWithoutFailed(subState, reducer);

const selectIsFailed =
    <T extends object>(state: T) =>
    <M extends OptimisticReducersMapObject<T>>(reducerMap: M) =>
    (selector: Selector<StateFromOptimisticReducersMapObject<M>>): boolean => {
        const stateWithoutFailed = selector(asIfNotFailed(state, reducerMap));
        const stateWithOptimistic = selector(state as StateFromOptimisticReducersMapObject<M>);

        return !isDeepEqual(stateWithOptimistic, stateWithoutFailed);
    };

export default selectIsFailed;
