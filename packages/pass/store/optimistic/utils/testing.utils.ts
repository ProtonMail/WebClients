import type { AnyAction, Reducer } from 'redux';

import type { DeterministicHistoryItem, OptimisticHistoryItem } from '../types';
import { HistoryFlag } from '../types';

export const createTestAction = (type?: string, payload?: any): AnyAction => ({
    type: type ?? `action-${Math.random()}`,
    payload,
});

export const createTestDeterministicAction = (type?: string, payload?: any): DeterministicHistoryItem => ({
    type: HistoryFlag.DETERMINISTIC,
    action: createTestAction(type, payload),
});

export const createTestOptimisticHistoryItem = (
    type?: string,
    payload?: any,
    failed?: boolean
): OptimisticHistoryItem => {
    return {
        type: HistoryFlag.OPTIMISTIC,
        id: `id-${Math.random()}`,
        action: createTestAction(type, payload),
        ...(failed !== undefined ? { failed } : {}),
    };
};

export type TestState<T = number> = { items: T[] };

export const createTestReducer =
    <T = number>(): Reducer<TestState<T>> =>
    (state = { items: [] }, action) => {
        switch (action.type) {
            case 'add': {
                return {
                    items: [...state.items, action.payload],
                };
            }
            case 'remove': {
                return { items: state.items.filter((value) => value !== action.payload) };
            }
            default:
                return state;
        }
    };

export const testReducer = createTestReducer();
