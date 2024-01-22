import type { PayloadAction } from '@reduxjs/toolkit';
import type { Action, Reducer } from 'redux';

import type { Maybe } from '@proton/pass/types';

import type { DeterministicHistoryItem, OptimisticHistoryItem } from '../types';
import { HistoryFlag } from '../types';

export const createTestAction = <T = any>(type?: string, payload?: T): PayloadAction<Maybe<T>> => ({
    type: type ?? `action-${Math.random()}`,
    payload,
});

export const createTestDeterministicAction = <T = any>(type?: string, payload?: T): DeterministicHistoryItem => ({
    type: HistoryFlag.DETERMINISTIC,
    action: createTestAction<T>(type, payload),
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
    (state = { items: [] }, action: Action) => {
        switch (action.type) {
            case 'add': {
                return {
                    items: [...state.items, (action as any).payload],
                };
            }
            case 'remove': {
                return { items: state.items.filter((value) => value !== (action as any).payload) };
            }
            default:
                return state;
        }
    };

export const testReducer = createTestReducer();
