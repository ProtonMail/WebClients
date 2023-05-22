import type { Selector } from '@reduxjs/toolkit';
import type { AnyAction, Reducer } from 'redux';

import type { MaybeArray } from '@proton/pass/types';

import { commitReducer } from './reducers/commit';
import { failReducer } from './reducers/fail';
import { initiateReducer } from './reducers/initiate';
import { revertReducer } from './reducers/revert';
import { asIfNotFailedSubSelector } from './selectors/select-is-failed';
import { asIfNotOptimisticSubSelector } from './selectors/select-is-optimistic';
import type {
    OptimisticMatcher,
    OptimisticMatchers,
    OptimisticState,
    WithOptimisticReducer,
    WrappedOptimisticState,
} from './types';
import { HistoryFlag } from './types';
import { getActionFromHistoryItem, unwrapOptimisticState } from './utils/transformers';
import { withHistoryAction } from './utils/with-history-action';

export const withInitialOptimisticState = <T extends object>(state: T): WrappedOptimisticState<T> => {
    const initialOptimistic: { optimistic: OptimisticState<T> } = {
        optimistic: {
            checkpoint: undefined,
            history: [],
        },
    };

    return {
        ...state,
        ...initialOptimistic,
    };
};

const applyOptimisticMatcher = (action: AnyAction) => (matcher: OptimisticMatcher) =>
    typeof matcher === 'string' ? matcher === action.type : matcher(action);

const withOptimistic = <T extends object>(
    matchersList: OptimisticMatchers[],
    reducer: Reducer<T>,
    options?: { sanitizeAction: (action: AnyAction) => AnyAction }
): {
    reducer: WithOptimisticReducer<T>;
    selectors: {
        asIfNotFailed: Selector<WrappedOptimisticState<T>, WrappedOptimisticState<T>>;
        asIfNotOptimistic: Selector<WrappedOptimisticState<T>, WrappedOptimisticState<T>>;
    };
} => {
    const initialState = reducer(undefined, { type: '__OPTIMISTIC_INIT__' });
    const initialOptimisticState = withInitialOptimisticState(initialState);

    const wrappedReducer: WithOptimisticReducer<T> = (outer = initialOptimisticState, optimisticAction: AnyAction) => {
        const action = options?.sanitizeAction?.(optimisticAction) ?? optimisticAction;

        const inner = unwrapOptimisticState(outer);
        const nextInner = reducer(inner, action);

        const { optimistic } = outer;

        for (const [index, matchers] of Object.entries(matchersList)) {
            for (const [key, matcher] of Object.entries(matchers) as [string, MaybeArray<OptimisticMatcher>][]) {
                const match = Array.isArray(matcher)
                    ? matcher.map(applyOptimisticMatcher(action)).find(Boolean)
                    : applyOptimisticMatcher(action)(matcher);

                if (match) {
                    const id = typeof match === 'string' ? match : index;

                    switch (key as keyof OptimisticMatchers) {
                        case 'initiate': {
                            const nextOptimistic = initiateReducer(inner, reducer, action, optimistic, id);

                            return {
                                ...nextOptimistic.history
                                    .map(getActionFromHistoryItem)
                                    .reduce(reducer, nextOptimistic.checkpoint!),
                                optimistic: nextOptimistic,
                            };
                        }

                        case 'commit': {
                            return {
                                ...nextInner,
                                optimistic: withHistoryAction(
                                    {
                                        id,
                                        action,
                                        type: HistoryFlag.OPTIMISTIC_EFFECT,
                                    },
                                    commitReducer(reducer, optimistic, id)
                                ),
                            };
                        }

                        case 'fail': {
                            return {
                                ...nextInner,
                                optimistic: withHistoryAction(
                                    {
                                        id,
                                        action,
                                        type: HistoryFlag.OPTIMISTIC_EFFECT,
                                    },
                                    failReducer(optimistic, id)
                                ),
                            };
                        }

                        case 'revert': {
                            const [revertedInner, nextOptimistic] = revertReducer(inner, reducer, optimistic, id);

                            return {
                                ...reducer(revertedInner, action),
                                optimistic: withHistoryAction(
                                    {
                                        id,
                                        action,
                                        type: HistoryFlag.OPTIMISTIC_EFFECT,
                                    },
                                    nextOptimistic
                                ),
                            };
                        }
                    }
                }
            }
        }

        if (inner === nextInner) {
            return outer;
        }

        return {
            ...nextInner,
            optimistic: withHistoryAction({ type: HistoryFlag.DETERMINISTIC, action }, outer.optimistic),
        };
    };

    wrappedReducer.innerReducer = reducer;

    return {
        reducer: wrappedReducer,
        selectors: {
            asIfNotFailed: asIfNotFailedSubSelector(wrappedReducer),
            asIfNotOptimistic: asIfNotOptimisticSubSelector(wrappedReducer),
        },
    };
};

export default withOptimistic;
