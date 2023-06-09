import { arrayReplace } from '@proton/pass/utils/array';
import { merge } from '@proton/pass/utils/object';

import type { OptimisticFailedHistoryItem, OptimisticHistoryItem, OptimisticState } from '../types';
import { isOptimisticHistoryItemWithId } from '../utils/assertions';

export const failReducer = <T>(optimistic: OptimisticState<T>, optimisticId: string): OptimisticState<T> => {
    const { checkpoint, history } = optimistic;
    const historyItemIndex = history.findIndex(isOptimisticHistoryItemWithId(optimisticId));

    if (historyItemIndex === -1) return optimistic;

    const historyItem = history[historyItemIndex] as OptimisticHistoryItem;
    const failedHistoryItem = merge(historyItem, { failed: true }) as OptimisticFailedHistoryItem;
    const nextHistory = arrayReplace(history, historyItemIndex, failedHistoryItem);

    return { checkpoint, history: nextHistory };
};
