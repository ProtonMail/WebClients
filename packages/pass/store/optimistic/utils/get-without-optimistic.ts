import { invert } from '@proton/pass/utils/fp';

import type { WithOptimisticReducer, WrappedOptimisticState } from '../types';
import { isOptimisticHistoryItem } from './assertions';
import { getActionFromHistoryItem } from './transformers';

/**
 * Returns the state resulting from applying every action in the
 * optimistic history - that is not an optimistic history item -
 * to the original unwrapped reducer & the latest optimistic
 * checkpoint state.
 */
const getWithoutOptimistic = <T extends {}>(
    state: WrappedOptimisticState<T>,
    { innerReducer }: WithOptimisticReducer<T>
): WrappedOptimisticState<T> => {
    const {
        optimistic: { history, checkpoint },
    } = state;

    if (checkpoint === undefined || history.length === 0) {
        return state;
    }

    const nextState = history
        .filter(invert(isOptimisticHistoryItem))
        .map(getActionFromHistoryItem)
        .reduce(innerReducer, checkpoint);

    return {
        ...nextState,
        optimistic: { checkpoint: undefined, history: [] },
    };
};

export default getWithoutOptimistic;
