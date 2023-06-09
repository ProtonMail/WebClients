import type { OptimisticState } from '../types';
import { createTestDeterministicAction, createTestOptimisticHistoryItem } from './testing.utils';
import { withHistoryAction } from './with-history-action';

describe('withHistoryAction', () => {
    test('Should append action to optimistic history if history is initialized', () => {
        const action = createTestDeterministicAction();
        const optimistic: OptimisticState<any> = { checkpoint: {}, history: [createTestOptimisticHistoryItem()] };

        const nextOptimistic = withHistoryAction<any>(action, optimistic);

        expect(nextOptimistic.checkpoint).toBeDefined();
        expect(nextOptimistic.checkpoint).toEqual(optimistic.checkpoint);
        expect(nextOptimistic.history).toEqual([optimistic.history[0], action]);
    });

    test('Should ignore action if optimistic history is empty', () => {
        const action = createTestDeterministicAction();
        const optimistic: OptimisticState<any> = { checkpoint: {}, history: [] };

        const nextOptimistic = withHistoryAction<any>(action, optimistic);

        expect(nextOptimistic.checkpoint).toBeDefined();
        expect(nextOptimistic.checkpoint).toEqual(optimistic.checkpoint);
        expect(nextOptimistic.history.length).toEqual(0);
    });
});
