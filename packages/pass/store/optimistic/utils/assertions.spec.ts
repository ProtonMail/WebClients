import type { Reducer } from 'redux';

import type { CombinedOptimisticReducer, WithOptimisticReducer } from '../types';
import { HistoryFlag } from '../types';
import {
    isCombinedOptimisticReducer,
    isDeterministicHistoryItem,
    isOptimisticHistoryItem,
    isOptimisticReducer,
    isOptimisticState,
} from './assertions';

describe('Optimistic assertions', () => {
    describe('History items', () => {
        test('is(Non)OptimisticHistoryItem should detect id property in item', () => {
            expect(
                isOptimisticHistoryItem({
                    type: HistoryFlag.DETERMINISTIC,
                    action: { type: 'not_optimistic ' },
                })
            ).toBe(false);

            expect(
                isOptimisticHistoryItem({
                    type: HistoryFlag.OPTIMISTIC,
                    id: `id-${Math.random()}`,
                    action: { type: 'optimistic ' },
                })
            ).toBe(true);

            expect(
                isDeterministicHistoryItem({
                    type: HistoryFlag.DETERMINISTIC,
                    action: { type: 'not_optimistic ' },
                })
            ).toBe(true);

            expect(
                isDeterministicHistoryItem({
                    type: HistoryFlag.OPTIMISTIC,
                    id: `id-${Math.random()}`,
                    action: { type: 'optimistic ' },
                })
            ).toBe(false);
        });
    });

    describe('Optimistic state', () => {
        test('isOptimisticState should return true if optimistic state', () => {
            expect(isOptimisticState({})).toEqual(false);
            expect(isOptimisticState({ optimistic: { checkpoint: undefined, history: [] } })).toEqual(true);
        });
    });

    describe('Optimistic reducer', () => {
        test('isOptimisticReducer should match the innerReducer property', () => {
            const reducer: Reducer = () => {};

            const optimisticReducer: WithOptimisticReducer = () => {};
            optimisticReducer.innerReducer = reducer;

            expect(isOptimisticReducer(reducer)).toBe(false);
            expect(isOptimisticReducer(optimisticReducer)).toBe(true);
        });

        test('isCombinedOptimisticReducer should match the innerCombinedReducers property', () => {
            const reducer: Reducer = () => {};

            const optimisticReducer: WithOptimisticReducer = () => {};
            optimisticReducer.innerReducer = reducer;

            const combinedOptimisticReducer: CombinedOptimisticReducer = () => {};
            combinedOptimisticReducer.innerCombinedReducers = { optimisticTest: optimisticReducer, test: reducer };

            expect(isCombinedOptimisticReducer(reducer)).toBe(false);
            expect(isCombinedOptimisticReducer(combinedOptimisticReducer)).toBe(true);
        });
    });
});
