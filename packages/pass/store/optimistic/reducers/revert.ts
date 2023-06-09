import type { Reducer } from 'redux';

import { arrayRemove } from '@proton/pass/utils/array';

import type { OptimisticState, WithOptimisticHistory } from '../types';
import { isOptimisticHistoryItemWithId } from '../utils/assertions';
import { splitHistoryOnFirstOptimisticItem } from '../utils/split-history';
import { getActionFromHistoryItem } from '../utils/transformers';

export const revertReducer = <T>(
    inner: T,
    reducer: Reducer<T>,
    optimistic: OptimisticState<T>,
    optimisticId: string
): readonly [T, OptimisticState<T>] => {
    const { history, checkpoint } = optimistic;
    const optimisticActionIndex = history.findIndex(isOptimisticHistoryItemWithId(optimisticId));

    if (optimisticActionIndex === -1) return [inner, optimistic] as const;

    if (optimisticActionIndex !== 0) {
        const nextHistory = arrayRemove(history, optimisticActionIndex);
        const nextInner = nextHistory.map(getActionFromHistoryItem).reduce(reducer, checkpoint);
        const nextOptimistic = { checkpoint, history: nextHistory };

        return [nextInner ?? inner, nextOptimistic] as const;
    }

    const [, ...other] = history;
    const [removableHistory, nextHistory] = splitHistoryOnFirstOptimisticItem(other);
    const nextCheckpoint = removableHistory.map(getActionFromHistoryItem).reduce(reducer, checkpoint);

    if (nextHistory.length === 0) {
        const nextOptimistic = { checkpoint: undefined, history: [] as WithOptimisticHistory };
        return [nextCheckpoint ?? inner, nextOptimistic] as const;
    }

    const nextInner = nextHistory.map(getActionFromHistoryItem).reduce(reducer, nextCheckpoint);
    const nextOptimistic = { checkpoint: nextCheckpoint, history: nextHistory };

    return [nextInner ?? inner, nextOptimistic] as const;
};
