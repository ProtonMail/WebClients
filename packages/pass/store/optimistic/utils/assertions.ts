import type { Reducer } from 'redux';

import type {
    CombinedOptimisticReducer,
    DeterministicHistoryItem,
    HistoryItem,
    OptimisticEffectHistoryItem,
    OptimisticFailedHistoryItem,
    OptimisticHistoryItem,
    OptimisticReducersMapObject,
    WithOptimisticReducer,
    WrappedOptimisticState,
} from '../types';
import { HistoryFlag } from '../types';

export const isOptimisticHistoryItem = (item: HistoryItem): item is OptimisticHistoryItem =>
    item.type === HistoryFlag.OPTIMISTIC;

export const isFailedOptimisticHistoryItem = (item: HistoryItem): item is OptimisticFailedHistoryItem =>
    item.type === HistoryFlag.OPTIMISTIC && Boolean(item.failed);

export const isOptimisticEffectHistoryItem = (item: HistoryItem): item is OptimisticEffectHistoryItem =>
    item.type === HistoryFlag.OPTIMISTIC_EFFECT;

export const isDeterministicHistoryItem = (item: HistoryItem): item is DeterministicHistoryItem =>
    item.type === HistoryFlag.DETERMINISTIC;

export const isOptimisticState = <T extends {}>(state?: T): state is WrappedOptimisticState<T> =>
    state !== undefined && state !== null && typeof state === 'object' && Boolean((state as any).optimistic);

export const isOptimisticReducer = <T>(
    reducer: (Reducer<T> | WithOptimisticReducer<T>) | OptimisticReducersMapObject<T>
): reducer is WithOptimisticReducer<T> => typeof (reducer as any)?.innerReducer === 'function';

export const isCombinedOptimisticReducer = <T>(reducer: Reducer<T>): reducer is CombinedOptimisticReducer =>
    typeof (reducer as any)?.innerCombinedReducers === 'object';

export const isOptimisticHistoryItemWithId =
    (optimisticId: string, options?: { failed: boolean }) => (item: HistoryItem) =>
        isOptimisticHistoryItem(item) &&
        item.id === optimisticId &&
        (options?.failed !== undefined ? Boolean(item.failed) === options.failed : true);

export const isOptimisticEffectHistoryItemWithId = (optimisticId: string) => (item: HistoryItem) =>
    isOptimisticEffectHistoryItem(item) && item.id === optimisticId;
