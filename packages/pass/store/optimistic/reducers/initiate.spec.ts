import { uniqueId } from '@proton/pass/utils/string';
import { omit } from '@proton/shared/lib/helpers/object';

import type { WrappedOptimisticState } from '../types';
import { HistoryFlag } from '../types';
import type { TestState } from '../utils/testing.utils';
import { createTestAction, createTestOptimisticHistoryItem, testReducer } from '../utils/testing.utils';
import { initiateReducer } from './initiate';

describe('optimistic initiate reducer', () => {
    test('should convert action to optimistic history item and add it to the history', () => {
        const state: WrappedOptimisticState<TestState> = {
            items: [],
            optimistic: {
                checkpoint: { items: [] },
                history: [],
            },
        };

        const testAction = createTestAction('add', 1);
        const optimisticId = uniqueId();

        const result = initiateReducer(
            omit(state, ['optimistic']),
            testReducer,
            testAction,
            state.optimistic,
            optimisticId
        );

        expect(result).toEqual({
            ...state.optimistic,
            history: [{ type: HistoryFlag.OPTIMISTIC, id: optimisticId, action: testAction }],
        });
    });

    test('should store a fresh checkpoint from the inner state if optimistic state was cleared', () => {
        const state: WrappedOptimisticState<TestState> = {
            items: [1, 2, 3],
            optimistic: {
                checkpoint: undefined,
                history: [],
            },
        };

        const optimisticId = uniqueId();
        const testAction = createTestAction('remove', 1);

        const result = initiateReducer(
            omit(state, ['optimistic']),
            testReducer,
            testAction,
            state.optimistic,
            optimisticId
        );

        expect(result).toEqual({
            checkpoint: { items: [1, 2, 3] },
            history: [{ type: HistoryFlag.OPTIMISTIC, id: optimisticId, action: testAction }],
        });
    });

    test('should remove history item and recompute optimistic state if optimisticId already exists before re-initiating', () => {
        const optimisticUpdate1 = createTestOptimisticHistoryItem('add', 1);
        const optimisticUpdate2 = createTestOptimisticHistoryItem('add', 3);
        const testAction = createTestAction('add', 2);

        const state: WrappedOptimisticState<TestState> = {
            items: [1, 2],
            optimistic: {
                checkpoint: { items: [] },
                history: [
                    optimisticUpdate1,
                    { type: HistoryFlag.DETERMINISTIC, action: testAction },
                    optimisticUpdate2,
                ],
            },
        };

        const result = initiateReducer(
            omit(state, ['optimistic']),
            testReducer,
            optimisticUpdate1.action,
            state.optimistic,
            optimisticUpdate1.id
        );

        expect(result).toEqual({
            checkpoint: { items: [2] },
            history: [optimisticUpdate2, optimisticUpdate1],
        });
    });
});
