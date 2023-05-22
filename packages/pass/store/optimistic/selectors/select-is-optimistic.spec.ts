import { combineReducers } from 'redux';

import type { OptimisticReducersMapObject, WrappedOptimisticState } from '../types';
import type { TestState } from '../utils/testing.utils';
import {
    createTestAction,
    createTestDeterministicAction,
    createTestOptimisticHistoryItem,
    testReducer,
} from '../utils/testing.utils';
import withOptimistic from '../with-optimistic';
import selectIsOptimistic, { asIfNotOptimistic } from './select-is-optimistic';

describe('selector as if is optimistic', () => {
    describe('asIfNotOptimistic', () => {
        test('should return empty state object if provided empty reducer map entries', () => {
            const reducers = { test: testReducer };

            const rootReducer = combineReducers(reducers);
            const state = rootReducer({ test: { items: [] } }, createTestAction());

            const reducerMap = {} as OptimisticReducersMapObject<typeof state>;
            const result = asIfNotOptimistic(state, reducerMap);

            expect(result).toEqual({});
        });

        test('should only keep the subset state inferred from the reducer map', () => {
            const state = {
                test: { items: [] },
                testOptimistic: {
                    items: [],
                    optimistic: {
                        checkpoint: { items: [] },
                        history: [],
                    },
                } as WrappedOptimisticState<TestState>,
            };

            const reducerMap = {
                testOptimistic: withOptimistic([], testReducer).reducer,
            };

            const result = asIfNotOptimistic(state, reducerMap);

            expect(Object.keys(result).length).toEqual(1);
            expect(result.testOptimistic).toEqual(state.testOptimistic);
        });

        test('should compute optimistic substate without optimistic updates', () => {
            const state = {
                testOptimistic: {
                    items: [1, 2, 3],
                    optimistic: {
                        checkpoint: { items: [] },
                        history: [
                            createTestDeterministicAction('add', 1),
                            createTestOptimisticHistoryItem('add', 2),
                            createTestOptimisticHistoryItem('add', 3),
                        ],
                    },
                } as WrappedOptimisticState<TestState>,
            };

            const optimisticReducers: OptimisticReducersMapObject<typeof state> = {
                testOptimistic: withOptimistic([], testReducer).reducer,
            };

            const result = asIfNotOptimistic(state, optimisticReducers);

            expect(result.testOptimistic?.items).toEqual([1]);
        });

        test('should handle deeply nested optimistic reducers', () => {
            const state = {
                depth1: {
                    depth2: {
                        testOptimistic: {
                            items: [1, 2, 3],
                            optimistic: {
                                checkpoint: { items: [] },
                                history: [
                                    createTestDeterministicAction('add', 1),
                                    createTestOptimisticHistoryItem('add', 2),
                                    createTestOptimisticHistoryItem('add', 3),
                                ],
                            },
                        } as WrappedOptimisticState<TestState>,
                    },
                },
            };

            const optimisticReducers = {
                depth1: {
                    depth2: {
                        testOptimistic: withOptimistic([], testReducer).reducer,
                    },
                },
            };

            const result = asIfNotOptimistic(state, optimisticReducers);

            expect(result.depth1.depth2.testOptimistic.items).toEqual([1]);
        });
    });

    describe('selectIsOptimistic', () => {
        test('should return true if selected state without optimistic updates diverges', () => {
            const state = {
                testOptimistic: {
                    items: [1, 2, 3],
                    optimistic: {
                        checkpoint: { items: [] },
                        history: [
                            createTestDeterministicAction('add', 1),
                            createTestOptimisticHistoryItem('add', 2),
                            createTestOptimisticHistoryItem('add', 3),
                        ],
                    },
                } as WrappedOptimisticState<TestState>,
            };

            const reducerMap = {
                testOptimistic: withOptimistic([], testReducer).reducer,
            };

            const isOptimistic = selectIsOptimistic(state)(reducerMap)((s) => s.testOptimistic.items);
            expect(isOptimistic).toBe(true);
        });

        test('should return false if both selected states with & without optimistic updates match', () => {
            const state = {
                testOptimistic: {
                    items: [1, 2, 3],
                    optimistic: {
                        checkpoint: { items: [] },
                        history: [
                            createTestDeterministicAction('add', 1),
                            createTestDeterministicAction('add', 2),
                            createTestDeterministicAction('add', 3),
                        ],
                    },
                } as WrappedOptimisticState<TestState>,
            };

            const reducerMap: OptimisticReducersMapObject<typeof state> = {
                testOptimistic: withOptimistic([], testReducer).reducer,
            };

            const isOptimistic = selectIsOptimistic(state)(reducerMap)((s) => s.testOptimistic.items);
            expect(isOptimistic).toBe(false);
        });
    });
});
