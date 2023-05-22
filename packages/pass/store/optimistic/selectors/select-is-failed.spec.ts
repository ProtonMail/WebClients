import { combineReducers } from 'redux';

import type { OptimisticReducersMapObject, WrappedOptimisticState } from '../types';
import type { TestState } from '../utils/testing.utils';
import { createTestAction, createTestOptimisticHistoryItem, testReducer } from '../utils/testing.utils';
import withOptimistic from '../with-optimistic';
import selectIsFailed, { asIfNotFailed } from './select-is-failed';

describe('selector as if optimistic failed', () => {
    describe('asIfNotFailed', () => {
        test('should return empty state object if provided empty reducer map entries', () => {
            const reducers = { test: testReducer };

            const rootReducer = combineReducers(reducers);
            const state = rootReducer({ test: { items: [] } }, createTestAction());

            const reducerMap = {} as OptimisticReducersMapObject<typeof state>;
            const result = asIfNotFailed(state, reducerMap);

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
                nestedOptimistic: {
                    testOptimistic: {
                        items: [],
                        optimistic: {
                            checkpoint: { items: [] },
                            history: [],
                        },
                    } as WrappedOptimisticState<TestState>,
                },
            };

            const reducerMap = {
                nestedOptimistic: {
                    testOptimistic: withOptimistic([], testReducer).reducer,
                },
            };

            const result = asIfNotFailed(state, reducerMap);

            expect(Object.keys(result).length).toEqual(1);
            expect(result.nestedOptimistic).toEqual(state.nestedOptimistic);
        });

        test('should compute optimistic substates without failed history items', () => {
            const failedAction = createTestOptimisticHistoryItem('add', 1);
            failedAction.failed = true;

            const state = {
                testOptimistic: {
                    items: [1, 2, 3],
                    optimistic: {
                        checkpoint: { items: [] },
                        history: [
                            failedAction,
                            createTestOptimisticHistoryItem('add', 2),
                            createTestOptimisticHistoryItem('add', 3),
                        ],
                    },
                } as WrappedOptimisticState<TestState>,
                test: {
                    items: [4, 5, 6],
                },
            };

            const optimisticReducers = {
                test: testReducer,
                testOptimistic: withOptimistic([], testReducer).reducer,
            };

            const result = asIfNotFailed(state, optimisticReducers);

            expect(result.testOptimistic.items).toEqual([2, 3]);
            expect(result.test.items).toEqual([4, 5, 6]);
        });

        test('should handle deeply nested optimistic reducers', () => {
            const failedAction = createTestOptimisticHistoryItem('add', 1);
            failedAction.failed = true;

            const state = {
                depth1: {
                    depth2: {
                        testOptimistic: {
                            items: [1, 2, 3],
                            optimistic: {
                                checkpoint: { items: [] },
                                history: [
                                    failedAction,
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

            const result = asIfNotFailed(state, optimisticReducers);

            expect(result.depth1.depth2.testOptimistic.items).toEqual([2, 3]);
        });
    });

    describe('selectIsFailed', () => {
        test('should return true if selected state has failed optimistic updates', () => {
            const failedAction = createTestOptimisticHistoryItem('add', 1);
            failedAction.failed = true;

            const state = {
                testOptimistic: {
                    items: [1, 2, 3],
                    optimistic: {
                        checkpoint: { items: [] },
                        history: [
                            failedAction,
                            createTestOptimisticHistoryItem('add', 2),
                            createTestOptimisticHistoryItem('add', 3),
                        ],
                    },
                } as WrappedOptimisticState<TestState>,
            };

            const reducerMap = {
                testOptimistic: withOptimistic([], testReducer).reducer,
            };

            const isFailed = selectIsFailed(state)(reducerMap)((s) => s.testOptimistic.items);
            expect(isFailed).toBe(true);
        });

        test('should return false if selected state has non-failed optimistic updates', () => {
            const state = {
                testOptimistic: {
                    items: [1, 2, 3],
                    optimistic: {
                        checkpoint: { items: [] },
                        history: [
                            createTestOptimisticHistoryItem('add', 1),
                            createTestOptimisticHistoryItem('add', 2),
                            createTestOptimisticHistoryItem('add', 3),
                        ],
                    },
                } as WrappedOptimisticState<TestState>,
            };

            const reducerMap = {
                testOptimistic: withOptimistic([], testReducer).reducer,
            };

            const isFailed = selectIsFailed(state)(reducerMap)((s) => s.testOptimistic.items);
            expect(isFailed).toBe(false);
        });
    });
});
