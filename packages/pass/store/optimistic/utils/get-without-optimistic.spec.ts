import type { WithOptimisticReducer, WrappedOptimisticState } from '../types';
import getWithoutOptimistic from './get-without-optimistic';
import type { TestState } from './testing.utils';
import { createTestDeterministicAction, createTestOptimisticHistoryItem, testReducer } from './testing.utils';

describe('getWithoutOptimistic', () => {
    test('should early return same state if optimistic history or checkpoint are empty', () => {
        const emptyCheckpoint: WrappedOptimisticState<TestState> = {
            items: [],
            optimistic: {
                checkpoint: undefined,
                history: [createTestDeterministicAction()],
            },
        };

        const stateEmptyHistory: WrappedOptimisticState<TestState> = {
            items: [],
            optimistic: {
                checkpoint: {
                    items: [],
                },
                history: [],
            },
        };

        expect(getWithoutOptimistic(emptyCheckpoint, {} as any)).toEqual(emptyCheckpoint);
        expect(getWithoutOptimistic(stateEmptyHistory, {} as any)).toEqual(stateEmptyHistory);
    });

    test('should apply every non-optimistic action in history to the current checkpoint', () => {
        const state: WrappedOptimisticState<TestState> = {
            items: [1, 2, 3],
            optimistic: {
                checkpoint: { items: [] },
                history: [
                    createTestOptimisticHistoryItem('add', 1),
                    createTestDeterministicAction('add', 2),
                    createTestDeterministicAction('add', 3),
                    createTestOptimisticHistoryItem('add', 4),
                ],
            },
        };

        const withOptimistic = { innerReducer: testReducer } as WithOptimisticReducer<TestState>;

        expect(getWithoutOptimistic(state, withOptimistic)).toEqual({
            items: [2, 3],
            optimistic: { checkpoint: undefined, history: [] },
        });
    });
});
