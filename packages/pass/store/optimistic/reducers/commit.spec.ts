import { uniqueId } from '@proton/pass/utils/string';

import type { OptimisticState } from '../types';
import { HistoryFlag } from '../types';
import type { TestState } from '../utils/testing.utils';
import { createTestDeterministicAction, createTestOptimisticHistoryItem, testReducer } from '../utils/testing.utils';
import { commitReducer } from './commit';

describe('optimistic commit reducer', () => {
    test('should return original optimistic state if optimisticId is not found in history', () => {
        jest.spyOn(console, 'error').mockImplementationOnce(jest.fn());

        const optimistic: OptimisticState<TestState> = {
            checkpoint: { items: [] },
            history: [createTestOptimisticHistoryItem('add', 1)],
        };

        const result = commitReducer(testReducer, optimistic, uniqueId());
        expect(result).toEqual(optimistic);
    });

    test("should unwrap an optimistic history item's action and replace it in-place in the history (if not first item in history)", () => {
        const optimisticUpdate1 = createTestOptimisticHistoryItem('add', 1);
        const optimisticUpdate2 = createTestOptimisticHistoryItem('add', 2);

        const optimistic: OptimisticState<TestState> = {
            checkpoint: { items: [] },
            history: [optimisticUpdate1, optimisticUpdate2],
        };

        const result = commitReducer(testReducer, optimistic, optimisticUpdate2.id);

        expect(result).toEqual({
            checkpoint: { items: [] },
            history: [
                optimisticUpdate1,
                {
                    id: optimisticUpdate2.id,
                    type: HistoryFlag.OPTIMISTIC_EFFECT,
                    action: optimisticUpdate2.action,
                },
            ],
        });
    });

    test('should reset optimistic state if committed optimisticId was the only optimistic update in history', () => {
        const optimisticUpdate = createTestOptimisticHistoryItem('add', 2);

        const optimistic: OptimisticState<TestState> = {
            checkpoint: { items: [] },
            history: [createTestDeterministicAction('add', 1), optimisticUpdate],
        };

        const result = commitReducer(testReducer, optimistic, optimisticUpdate.id);
        expect(result).toEqual({
            checkpoint: undefined,
            history: [],
        });
    });

    test('should recompute optimistic state up until next optimistic update if optimisticId is the first item in history', () => {
        const optimisticUpdate1 = createTestOptimisticHistoryItem('add', 1);
        const optimisticUpdate2 = createTestOptimisticHistoryItem('add', 3);

        const optimistic: OptimisticState<TestState> = {
            checkpoint: { items: [] },
            history: [optimisticUpdate1, createTestDeterministicAction('add', 2), optimisticUpdate2],
        };

        const result = commitReducer(testReducer, optimistic, optimisticUpdate1.id);
        expect(result).toEqual({
            checkpoint: { items: [1, 2] },
            history: [optimisticUpdate2],
        });
    });

    test('should reset optimistic state if optimisticId is the first and only item in history', () => {
        const optimisticUpdate = createTestOptimisticHistoryItem('add', 1);

        const optimistic: OptimisticState<TestState> = {
            checkpoint: { items: [] },
            history: [optimisticUpdate],
        };

        const result = commitReducer(testReducer, optimistic, optimisticUpdate.id);
        expect(result).toEqual({
            checkpoint: undefined,
            history: [],
        });
    });
});
