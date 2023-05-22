import type { WithOptimisticReducer, WrappedOptimisticState } from '../types';
import getWithoutFailed from './get-without-failed';
import type { TestState } from './testing.utils';
import { createTestDeterministicAction, createTestOptimisticHistoryItem, testReducer } from './testing.utils';

describe('getWithoutFailed', () => {
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

        expect(getWithoutFailed(emptyCheckpoint, {} as any)).toEqual(emptyCheckpoint);
        expect(getWithoutFailed(stateEmptyHistory, {} as any)).toEqual(stateEmptyHistory);
    });

    test('should apply every non-failed action in history to the current checkpoint', () => {
        const failedAction = createTestOptimisticHistoryItem('add', 2);
        failedAction.failed = true;

        const state: WrappedOptimisticState<TestState> = {
            items: [1, 2, 3],
            optimistic: {
                checkpoint: { items: [] },
                history: [
                    createTestOptimisticHistoryItem('add', 1),
                    failedAction,
                    createTestDeterministicAction('add', 3),
                ],
            },
        };

        const withOptimistic = { innerReducer: testReducer } as WithOptimisticReducer<TestState>;

        expect(getWithoutFailed(state, withOptimistic)).toEqual({
            items: [1, 3],
            optimistic: { checkpoint: undefined, history: [] },
        });
    });
});
