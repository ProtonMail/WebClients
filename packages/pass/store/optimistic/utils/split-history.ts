import type { WithOptimisticHistory } from '../types';
import { isOptimisticHistoryItem } from './assertions';

/**
 * Splits an OptimisticHistory into two parts :
 * - every action before the first optimistic item matched in the history
 * - the rest of the actions including the first optimistic item matched
 *
 * Because the split happens on the first optimistic item, it is safe to
 * assume that all items that end up on the left side are simple actions.
 */

export const splitHistoryOnFirstOptimisticItem = (
    history: WithOptimisticHistory
): readonly [WithOptimisticHistory, WithOptimisticHistory] => {
    const firstOptimisticItemIndex = history.findIndex(isOptimisticHistoryItem);

    if (firstOptimisticItemIndex === -1) {
        return [history, [] as WithOptimisticHistory] as const;
    }

    const left = history.slice(0, firstOptimisticItemIndex);
    const right = history.slice(firstOptimisticItemIndex);

    return [left, right] as const;
};
