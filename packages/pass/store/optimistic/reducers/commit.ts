import type { Reducer } from 'redux';

import { arrayReplace } from '@proton/pass/utils/array';

import { HistoryFlag, type OptimisticHistoryItem, type OptimisticState } from '../types';
import { isOptimisticHistoryItem, isOptimisticHistoryItemWithId } from '../utils/assertions';
import { splitHistoryOnFirstOptimisticItem } from '../utils/split-history';
import { getActionFromHistoryItem } from '../utils/transformers';

export const commitReducer = <T>(
    reducer: Reducer<T>,
    optimistic: OptimisticState<T>,
    optimisticId: string
): OptimisticState<T> => {
    const { history, checkpoint } = optimistic;
    const optimisticActionIndex = history.findIndex(isOptimisticHistoryItemWithId(optimisticId));

    if (optimisticActionIndex === -1) return optimistic;

    if (optimisticActionIndex !== 0) {
        const { length: optimisticItemsLeft } = history.filter(isOptimisticHistoryItem);

        if (optimisticItemsLeft === 1) {
            return { checkpoint: undefined, history: [] };
        }

        const { action: actionToBeCommited } = history[optimisticActionIndex] as OptimisticHistoryItem;

        const nextHistory = arrayReplace(history, optimisticActionIndex, {
            id: optimisticId,
            type: HistoryFlag.OPTIMISTIC_EFFECT,
            action: actionToBeCommited,
        });

        return { checkpoint, history: nextHistory };
    }

    const [first, ...other] = history;
    const [removableHistory, nextHistory] = splitHistoryOnFirstOptimisticItem(other);
    const nextCheckpoint = [first, ...removableHistory].map(getActionFromHistoryItem).reduce(reducer, checkpoint);

    return {
        checkpoint: nextHistory.length ? nextCheckpoint : undefined,
        history: nextHistory,
    };
};
