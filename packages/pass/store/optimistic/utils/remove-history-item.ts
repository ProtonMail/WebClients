import type { Reducer } from 'redux';

import { arrayRemove } from '@proton/pass/utils/array';

import type { OptimisticState } from '../types';
import { isOptimisticHistoryItemWithId } from './assertions';
import { splitHistoryOnFirstOptimisticItem } from './split-history';
import { getActionFromHistoryItem } from './transformers';

/**
 * Removes an history item from the optimistic item by its optimisticId.
 * - If optimisticId is not found in history, early return
 * - If the item matched by optimisticId is the first in the history list, we can safely remove it and recaculate
 *   the next checkpoint as being the state resulting from applying every action up until the NEXT optimistic
 *   item in history (if any). The next history can be then re-computed as the remaining actions starting FROM
 *   this NEXT optimistic item in history.
 * - If the matched item is anywhere else in the optimistic history, remove it.
 */
export const removeHistoryItem = <T>(
    reducer: Reducer<T>,
    optimistic: OptimisticState<T>,
    optimisticId: string
): OptimisticState<T> => {
    const { history, checkpoint } = optimistic;
    const historyItemIndex = history.findIndex(isOptimisticHistoryItemWithId(optimisticId));

    if (historyItemIndex === -1) {
        return optimistic;
    }

    if (historyItemIndex === 0) {
        const [, ...other] = history;
        const [removableHistory, nextHistory] = splitHistoryOnFirstOptimisticItem(other);
        const nextCheckpoint = removableHistory.map(getActionFromHistoryItem).reduce(reducer, checkpoint);

        return { checkpoint: nextCheckpoint, history: nextHistory };
    }

    return { checkpoint, history: arrayRemove(history, historyItemIndex) };
};
