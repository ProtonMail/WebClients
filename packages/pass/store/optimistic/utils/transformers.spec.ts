import type { Reducer } from 'redux';

import { omit } from '@proton/shared/lib/helpers/object';

import type {
    DeterministicHistoryItem,
    OptimisticHistoryItem,
    WithOptimisticReducer,
    WrappedOptimisticState,
} from '../types';
import { HistoryFlag } from '../types';
import { combineOptimisticReducers } from './combine-optimistic-reducers';
import { getActionFromHistoryItem, sanitizeOptimisticReducerMapObject, unwrapOptimisticState } from './transformers';

describe('Optimistic data transformers', () => {
    describe('unwrapOptimisticState', () => {
        test('should omit optimistic state correctly from result', () => {
            const wrappedState: WrappedOptimisticState<{ items: number[] }> = {
                items: [1, 2, 3],
                optimistic: {
                    checkpoint: { items: [1, 2] },
                    history: [
                        {
                            type: HistoryFlag.DETERMINISTIC,
                            action: { type: 'no_optimistic' },
                        },
                    ],
                },
            };

            expect(unwrapOptimisticState(wrappedState)).toEqual(omit(wrappedState, ['optimistic']));
        });
    });

    describe('getActionFromHistoryItem', () => {
        test('should resolve underlying action for optimistic history item', () => {
            const optimisticItem: OptimisticHistoryItem = {
                type: HistoryFlag.OPTIMISTIC,
                id: 'optimistic',
                action: { type: 'test_optimistic' },
            };

            const nonOptimisticItem: DeterministicHistoryItem = {
                type: HistoryFlag.DETERMINISTIC,
                action: { type: 'no_optimistic' },
            };

            expect(getActionFromHistoryItem(optimisticItem)).toEqual(optimisticItem.action);
            expect(getActionFromHistoryItem(nonOptimisticItem)).toEqual(nonOptimisticItem.action);
        });
    });

    describe('sanitizeOptimisticReducerMapObject', () => {
        test('should unwrap every combined optimistic reducer', () => {
            const reducer: Reducer = () => {};

            const optimisticReducer: WithOptimisticReducer = () => {};
            optimisticReducer.innerReducer = reducer;

            const combinedOptimisticReducer = combineOptimisticReducers({
                reducer,
                optimisticReducer,
            });

            const nestedCombinedOptimisticReducer = combineOptimisticReducers({
                reducer,
                combinedOptimisticReducer,
            });

            const reducerMap = {
                reducer,
                optimisticReducer,
                combinedOptimisticReducer,
                nestedCombinedOptimisticReducer,
            };

            const result = sanitizeOptimisticReducerMapObject(reducerMap);

            expect(result).toEqual({
                reducer,
                optimisticReducer,
                combinedOptimisticReducer: {
                    reducer,
                    optimisticReducer,
                },
                nestedCombinedOptimisticReducer: {
                    reducer,
                    combinedOptimisticReducer: {
                        reducer,
                        optimisticReducer,
                    },
                },
            });
        });
    });
});
