import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import type { MeetState } from '../rootReducer';
import {
    connectionReducer,
    resetConnection,
    selectIsWebsocketReconnecting,
    setIsWebsocketReconnecting,
} from './connectionSlice';

const createStore = () => {
    const store = configureStore({ reducer: { ...connectionReducer } });

    return {
        dispatch: store.dispatch,
        getIsWebsocketReconnecting: () => selectIsWebsocketReconnecting(store.getState() as MeetState),
    };
};

describe('connectionSlice', () => {
    describe('isWebsocketReconnecting', () => {
        it('should start as not reconnecting', () => {
            const { getIsWebsocketReconnecting } = createStore();

            expect(getIsWebsocketReconnecting()).toBe(false);
        });

        it('should follow what is set', () => {
            const { dispatch, getIsWebsocketReconnecting } = createStore();

            dispatch(setIsWebsocketReconnecting(true));
            expect(getIsWebsocketReconnecting()).toBe(true);

            dispatch(setIsWebsocketReconnecting(false));
            expect(getIsWebsocketReconnecting()).toBe(false);
        });

        it('should be cleared when the connection state is reset', () => {
            const { dispatch, getIsWebsocketReconnecting } = createStore();

            dispatch(setIsWebsocketReconnecting(true));
            dispatch(resetConnection());

            expect(getIsWebsocketReconnecting()).toBe(false);
        });
    });
});
