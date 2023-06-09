import type { WithOptimisticHistory } from '../types';
import { isOptimisticHistoryItem } from './assertions';
import { splitHistoryOnFirstOptimisticItem } from './split-history';
import { createTestDeterministicAction, createTestOptimisticHistoryItem } from './testing.utils';

describe('splitHistoryOnFirstOptimisticItem', () => {
    test('should return empty right side if no optimistic actions in history', () => {
        const history = [createTestDeterministicAction()];
        const [left, right] = splitHistoryOnFirstOptimisticItem(history);

        expect(right.length).toEqual(0);
        expect(left).toEqual(history);
    });

    test('left side should only contain AnyActions and no optimistic actions', () => {
        const history: WithOptimisticHistory = [
            createTestDeterministicAction(),
            createTestOptimisticHistoryItem(),
            createTestDeterministicAction(),
            createTestOptimisticHistoryItem(),
        ];

        const [left, right] = splitHistoryOnFirstOptimisticItem(history);

        expect(left.some(isOptimisticHistoryItem)).toBe(false);
        expect(left).toEqual(history.slice(0, 1));
        expect(right).toEqual(history.slice(1));
    });
});
