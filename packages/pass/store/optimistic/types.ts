import type { Selector } from '@reduxjs/toolkit';
import type { AnyAction, Reducer } from 'redux';

import type { DefinedPropertiesOnly, MaybeArray } from '@proton/pass/types';

export type OptimisticMatcherResult = boolean | string;
export type OptimisticMatcher = string | ((action: AnyAction) => OptimisticMatcherResult);

export interface OptimisticMatchers {
    initiate: MaybeArray<OptimisticMatcher>;
    commit?: MaybeArray<OptimisticMatcher>;
    fail?: MaybeArray<OptimisticMatcher>;
    revert?: MaybeArray<OptimisticMatcher>;
}

export enum HistoryFlag {
    OPTIMISTIC,
    OPTIMISTIC_EFFECT,
    DETERMINISTIC,
}

export type OptimisticActionId = string;

export type DeterministicHistoryItem = {
    type: HistoryFlag.DETERMINISTIC;
    action: AnyAction;
};

export type OptimisticHistoryItem = {
    id: OptimisticActionId;
    type: HistoryFlag.OPTIMISTIC;
    action: AnyAction;
    failed?: boolean;
};

export type OptimisticEffectHistoryItem = {
    id: OptimisticActionId;
    type: HistoryFlag.OPTIMISTIC_EFFECT;
    action: AnyAction;
};

export type OptimisticFailedHistoryItem = OptimisticHistoryItem & { failed: true };
export type HistoryItem = DeterministicHistoryItem | OptimisticHistoryItem | OptimisticEffectHistoryItem;
export type WithOptimisticHistory = HistoryItem[];

export type OptimisticState<T> = {
    checkpoint?: T;
    history: WithOptimisticHistory;
};

export type WrappedOptimisticState<T = {}> = { optimistic: OptimisticState<T> } & T;

export type MaybeOptimisticStateObject = {
    [key: string | number | symbol]: { optimistic?: OptimisticState<any> } | MaybeOptimisticStateObject;
};

export type WithOptimisticReducer<T = any> = Reducer<WrappedOptimisticState<T>> & {
    innerReducer: Reducer<T>;
};

export type CombinedOptimisticReducer<T = any> = Reducer<T, any> & {
    innerCombinedReducers: { [K in keyof T]: Reducer<T[K]> };
};

export type OptimisticReducersMapValues<T = any> =
    | (Reducer<T> | WithOptimisticReducer<T>)
    | OptimisticReducersMapObject<T>;

export type UnwrapOptimisticReducersMapValues<T> = Exclude<
    T extends WithOptimisticReducer<infer S>
        ? WrappedOptimisticState<S>
        : T extends Reducer<infer S>
        ? S
        : T extends OptimisticReducersMapObject<any>
        ? StateFromOptimisticReducersMapObject<T>
        : never,
    undefined
>;

export type OptimisticReducersMapObject<S extends any = any> = {
    [K in keyof Partial<S>]: OptimisticReducersMapValues<S[K]>;
};

export type StateFromOptimisticReducersMapObject<M> = DefinedPropertiesOnly<
    M extends OptimisticReducersMapObject<any>
        ? {
              [P in keyof M]-?: UnwrapOptimisticReducersMapValues<M[P]>;
          }
        : never
>;

export type OptimisticSelector<M extends OptimisticReducersMapObject, Result extends any = any> = Selector<
    StateFromOptimisticReducersMapObject<M>,
    Result
>;
