import type { OptimisticReducersMapObject, WrappedOptimisticState } from '../types';
import type { TestState } from '../utils/testing.utils';
import {
    createTestDeterministicAction,
    createTestOptimisticHistoryItem,
    createTestReducer,
} from '../utils/testing.utils';
import withOptimistic from '../with-optimistic';
import selectOptimisticList from './select-optimistic-list';

describe('selectOptimisticList', () => {
    test('should map optimistic list items to optimistic state', () => {
        type TestItem = { value: number };

        const state = {
            testOptimistic: {
                items: [{ value: 1 }, { value: 2 }, { value: 3 }],
                optimistic: {
                    checkpoint: { items: [] },
                    history: [
                        createTestOptimisticHistoryItem('add', { value: 1 }, true),
                        createTestDeterministicAction('add', { value: 2 }),
                        createTestOptimisticHistoryItem('add', { value: 3 }, false),
                    ],
                },
            } as WrappedOptimisticState<TestState<TestItem>>,
        };

        const reducerMap: OptimisticReducersMapObject<typeof state> = {
            testOptimistic: withOptimistic([], createTestReducer<TestItem>()).reducer,
        };
        const result = selectOptimisticList(reducerMap)(
            (state) => state.testOptimistic.items,
            (item) => item.value
        )(state);

        expect(result).toEqual([
            { value: 1, failed: true, optimistic: true },
            { value: 2, failed: false, optimistic: false },
            { value: 3, failed: false, optimistic: true },
        ]);
    });
});
