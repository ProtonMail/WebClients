import type { AnyAction, Reducer } from 'redux';

import type { OptimisticState } from '../types';
import { HistoryFlag } from '../types';
import { isOptimisticHistoryItemWithId } from '../utils/assertions';
import { removeHistoryItem } from '../utils/remove-history-item';

/*
 * This function requires inner in case there is no initiated
 * checkpoint at the time when this initiation action is coming
 * through. This can happen if this is either the first ever
 * initiation action or if all previous initiation actions have
 * been removed already.
 */
export const initiateReducer = <T>(
    inner: T,
    reducer: Reducer<T>,
    action: AnyAction,
    optimistic: OptimisticState<T>,
    optimisticId: string
): OptimisticState<T> => {
    const historyItemIndex = optimistic.history.some(isOptimisticHistoryItemWithId(optimisticId));

    const { checkpoint, history } = historyItemIndex
        ? removeHistoryItem(reducer, optimistic, optimisticId)
        : optimistic;

    return {
        checkpoint: checkpoint || inner,
        history: [
            ...history,
            {
                type: HistoryFlag.OPTIMISTIC,
                id: optimisticId,
                action,
            },
        ],
    };
};
