import { uniqueId } from '@proton/pass/utils/string';

import type { OptimisticState } from '../types';
import { removeHistoryItem } from './remove-history-item';
import type { TestState } from './testing.utils';
import { createTestDeterministicAction, createTestOptimisticHistoryItem, testReducer } from './testing.utils';

describe('removeHistoryItem', () => {
    test('should early return if no items matched', () => {
        const optimistic: OptimisticState<TestState> = {
            checkpoint: undefined,
            history: [createTestOptimisticHistoryItem()],
        };

        const nextOptimistic = removeHistoryItem(testReducer, optimistic, uniqueId());
        expect(nextOptimistic).toEqual(optimistic);
    });

    test('should split history and optimize optimistic state if action to remove is the first in history', () => {
        const first = createTestOptimisticHistoryItem('add', 1);

        /* create checkpoint for current history stack */
        const checkpoint = testReducer({ items: [] }, first.action);

        const history = [
            first,
            createTestDeterministicAction('add', 2),
            createTestOptimisticHistoryItem('remove', 1),
            createTestDeterministicAction('remove', 2),
        ];

        const optimistic: OptimisticState<TestState> = { checkpoint, history };
        const nextOptimistic = removeHistoryItem(testReducer, optimistic, first.id);

        /**
         * first 2 actions in history were remove and checkpoint recomputed up
         * until next optimistic action
         */
        expect(nextOptimistic.checkpoint?.items).toEqual([1, 2]);
        expect(nextOptimistic.history).toEqual([history[2], history[3]]);
    });

    test('should pop optimistic history item from history', () => {
        const optimisticAction = createTestOptimisticHistoryItem('remove', 1);
        const history = [
            createTestDeterministicAction('add', 1),
            optimisticAction,
            createTestDeterministicAction('add', 2),
        ];

        const optimistic: OptimisticState<TestState> = { checkpoint: { items: [0] }, history };
        const nextOptimistic = removeHistoryItem(testReducer, optimistic, optimisticAction.id);

        expect(nextOptimistic.checkpoint).toBeDefined();
        expect(nextOptimistic.checkpoint?.items).toEqual(optimistic.checkpoint?.items);
        expect(nextOptimistic.history).toEqual([history[0], history[2]]);
    });
});
