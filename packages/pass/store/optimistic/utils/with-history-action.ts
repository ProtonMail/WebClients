import type { HistoryItem, OptimisticState } from '../types';

export const withHistoryAction = <T>(action: HistoryItem, optimistic: OptimisticState<T>): OptimisticState<T> => {
    const { history, checkpoint } = optimistic;

    if (history.length !== 0) {
        return {
            history: [...history, action],
            checkpoint,
        };
    }

    return optimistic;
};
