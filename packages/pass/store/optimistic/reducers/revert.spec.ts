import { uniqueId } from '@proton/pass/utils/string';
import { omit } from '@proton/shared/lib/helpers/object';

import type { WrappedOptimisticState } from '../types';
import type { TestState } from '../utils/testing.utils';
import { createTestDeterministicAction, createTestOptimisticHistoryItem, testReducer } from '../utils/testing.utils';
import { revertReducer } from './revert';

describe('optimistic revert reducer', () => {
    test('should return original inner / optimistic state tuple if optimisticId is not found in history', () => {
        jest.spyOn(console, 'error').mockImplementationOnce(jest.fn());

        const state: WrappedOptimisticState<TestState> = {
            items: [],
            optimistic: {
                checkpoint: { items: [] },
                history: [],
            },
        };

        const result = revertReducer(omit(state, ['optimistic']), testReducer, state.optimistic, uniqueId());
        expect(result).toEqual([omit(state, ['optimistic']), state.optimistic]);
    });

    test('should remove optimistic action from optimistic state and recompute inner state', () => {
        const optimisticUpdate1 = createTestOptimisticHistoryItem('add', 1);
        const optimisticUpdate2 = createTestOptimisticHistoryItem('add', 2);

        const state: WrappedOptimisticState<TestState> = {
            items: [1, 2],
            optimistic: {
                checkpoint: { items: [] },
                history: [optimisticUpdate1, optimisticUpdate2],
            },
        };

        const [nextInner, nextOptimistic] = revertReducer(
            omit(state, ['optimistic']),
            testReducer,
            state.optimistic,
            optimisticUpdate2.id
        );

        expect(nextInner).toEqual({ items: [1] });
        expect(nextOptimistic).toEqual({ checkpoint: { items: [] }, history: [optimisticUpdate1] });
    });

    test('should remove optimistic action + recompute inner state & optimistic state up until next optimistic update if optimisticId is first in history', () => {
        const optimisticUpdate1 = createTestOptimisticHistoryItem('add', 1);
        const optimisticUpdate2 = createTestOptimisticHistoryItem('add', 3);

        const state: WrappedOptimisticState<TestState> = {
            items: [1, 2, 3],
            optimistic: {
                checkpoint: { items: [] },
                history: [optimisticUpdate1, createTestDeterministicAction('add', 2), optimisticUpdate2],
            },
        };

        const [nextInner, nextOptimistic] = revertReducer(
            omit(state, ['optimistic']),
            testReducer,
            state.optimistic,
            optimisticUpdate1.id
        );

        expect(nextInner).toEqual({ items: [2, 3] });
        expect(nextOptimistic).toEqual({ checkpoint: { items: [2] }, history: [optimisticUpdate2] });
    });

    test('should remove optimistic action + recompute inner state & reset optimistic state if optimisticId is the first & only in history', () => {
        const optimisticUpdate = createTestOptimisticHistoryItem('add', 1);

        const state: WrappedOptimisticState<TestState> = {
            items: [1],
            optimistic: {
                checkpoint: { items: [] },
                history: [optimisticUpdate],
            },
        };

        const [nextInner, nextOptimistic] = revertReducer(
            omit(state, ['optimistic']),
            testReducer,
            state.optimistic,
            optimisticUpdate.id
        );

        expect(nextInner).toEqual({ items: [] });
        expect(nextOptimistic).toEqual({ checkpoint: undefined, history: [] });
    });
});
