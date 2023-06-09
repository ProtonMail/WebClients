import { invert } from '@proton/pass/utils/fp';

import type { WithOptimisticReducer, WrappedOptimisticState } from '../types';
import { isFailedOptimisticHistoryItem } from './assertions';
import { getActionFromHistoryItem } from './transformers';

/**
 * Returns the state resulting from applying every action in the
 * optimistic history - except for optimistic history items that
 * are flagged as having failed - to the original unwrapped reducer &
 * the latest optimistic checkpoint state.
 */
const getWithoutFailed = <T extends {}>(
    state: WrappedOptimisticState<T>,
    { innerReducer }: WithOptimisticReducer<T>
): WrappedOptimisticState<T> => {
    const { optimistic } = state;
    const { history, checkpoint } = optimistic;

    if (checkpoint === undefined || history.length === 0) {
        return state;
    }

    const nextState = history
        .filter(invert(isFailedOptimisticHistoryItem))
        .map(getActionFromHistoryItem)
        .reduce(innerReducer, checkpoint);

    return {
        ...nextState,
        optimistic: { checkpoint: undefined, history: [] },
    };
};

export default getWithoutFailed;
