import type { Unpack } from '@proton/pass/types';
import { invert } from '@proton/pass/utils/fp/predicates';

import type { OptimisticReducersMapObject, OptimisticSelector, StateFromOptimisticReducersMapObject } from '../types';
import { asIfNotFailed } from './select-is-failed';
import { asIfNotOptimistic } from './select-is-optimistic';

export type OptimisticList<T extends any[]> = (Unpack<T> & { optimistic: boolean; failed: boolean })[];

/**
 * When retrieving a list from a selector for an optimistic sub-state,
 * it can be helpful to map each list item as being optimistic or failed
 * in a single pass.
 *
 * The "lens" function is necessary in order to define how we should compare items
 * (ie: checking on a specific key instead of relying on reference checks).
 */
const selectOptimisticList =
    <T extends {}, M extends OptimisticReducersMapObject>(reducerMap: M) =>
    <R extends any[]>(selector: OptimisticSelector<M, R>, lens: (item: Unpack<R>) => any) =>
    (state: T): OptimisticList<R> => {
        const stateWithoutOptimistic = selector(asIfNotOptimistic(state, reducerMap));
        const stateWithoutFailed = selector(asIfNotFailed(state, reducerMap));
        const stateWithOptimistic = selector(state as any as StateFromOptimisticReducersMapObject<M>);

        const compare = (value: Unpack<R>, stateToCompare: R): boolean => {
            const match = lens(value);
            return stateToCompare.some((val) => match === lens(val));
        };

        return stateWithOptimistic.map((value) => ({
            ...value,
            optimistic: invert(compare)(value, stateWithoutOptimistic),
            failed: invert(compare)(value, stateWithoutFailed),
        }));
    };

export default selectOptimisticList;
