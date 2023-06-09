import type { WrappedOptimisticState } from '../types';
import type { TestState } from '../utils/testing.utils';
import { createTestOptimisticHistoryItem } from '../utils/testing.utils';
import selectFailedAction from './select-failed-action';

describe('select failed action', () => {
    test('should return first failed action matching optimisticId', () => {
        const failedAction = createTestOptimisticHistoryItem('test', {}, true);

        const state = {
            test: {
                items: [],
                optimistic: {
                    checkpoint: { items: [] },
                    history: [failedAction],
                },
            } as WrappedOptimisticState<TestState>,
        };

        const result = selectFailedAction(failedAction.id)(state.test);
        expect(result).toEqual(failedAction);
    });

    test('should return undefined if action is not failed', () => {
        const failedAction = createTestOptimisticHistoryItem('test', {}, false);

        const state = {
            test: {
                items: [],
                optimistic: {
                    checkpoint: { items: [] },
                    history: [failedAction],
                },
            } as WrappedOptimisticState<TestState>,
        };

        const result = selectFailedAction(failedAction.id)(state.test);
        expect(result).toEqual(undefined);
    });

    test('should return undefined if no match', () => {
        const failedAction = createTestOptimisticHistoryItem('test', {}, false);

        const state = {
            test: {
                items: [],
                optimistic: {
                    checkpoint: { items: [] },
                    history: [failedAction],
                },
            } as WrappedOptimisticState<TestState>,
        };

        const result = selectFailedAction('unknown-id')(state.test);
        expect(result).toEqual(undefined);
    });
});
