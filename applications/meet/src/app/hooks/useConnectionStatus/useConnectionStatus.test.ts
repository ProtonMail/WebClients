import { createElement } from 'react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import type { UnknownAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { ConnectionState } from 'livekit-client';

import {
    connectionReducer,
    resetConnection,
    setIsReconnecting,
    setIsWebsocketReconnecting,
    setJoinedRoom,
    setMlsRetrying,
    setReconnectionFailed,
} from '@proton/meet/store/slices/connectionSlice';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';
import { SECOND } from '@proton/shared/lib/constants';

import { type ConnectionStatus, useConnectionStatus } from './useConnectionStatus';

const renderConnectionStatus = () => {
    const store = configureStore({ reducer: { ...connectionReducer } });
    const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(Provider, { context: ProtonStoreContext, store, children });
    let currentLiveKitConnectionState: ConnectionState | null = ConnectionState.Connected;
    const { result, rerender } = renderHook<ConnectionStatus, ConnectionState | null>(
        (liveKitConnectionState) => useConnectionStatus(liveKitConnectionState),
        { wrapper, initialProps: currentLiveKitConnectionState }
    );

    const update = ({
        connection = [],
        liveKit = ConnectionState.Connected,
    }: {
        connection?: readonly UnknownAction[];
        liveKit?: ConnectionState | null;
    }) => {
        act(() => {
            store.dispatch(resetConnection());
            connection.forEach((action) => store.dispatch(action));
        });
        if (liveKit !== currentLiveKitConnectionState) {
            currentLiveKitConnectionState = liveKit;
            rerender(liveKit);
        }
    };

    return { result, update };
};

const advance = (ms: number) => {
    act(() => {
        vi.advanceTimersByTime(ms);
    });
};

const causes = [
    { cause: 'fullRejoin', reconnecting: { connection: [setIsReconnecting(true)], liveKit: null } },
    { cause: 'encryptionRetry', reconnecting: { connection: [setMlsRetrying(true)] } },
    { cause: 'liveKitReconnect', reconnecting: { liveKit: ConnectionState.Reconnecting } },
    { cause: 'liveKitReconnect', reconnecting: { liveKit: ConnectionState.SignalReconnecting } },
    { cause: 'meetingServer', reconnecting: { connection: [setIsWebsocketReconnecting(true)] } },
] as const;

describe('useConnectionStatus', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('is connected while nothing reconnects', () => {
        const { result } = renderConnectionStatus();

        expect(result.current).toEqual({ phase: 'connected' });
    });

    it.each(causes)('is reconnecting with the cause $cause', ({ cause, reconnecting }) => {
        const { result, update } = renderConnectionStatus();

        update(reconnecting);

        expect(result.current).toEqual({ phase: 'reconnecting', cause });
    });

    it.each(causes)('is reconnected for 3 seconds once $cause ends, then connected', ({ reconnecting }) => {
        const { result, update } = renderConnectionStatus();

        update(reconnecting);
        update({});

        expect(result.current).toEqual({ phase: 'reconnected' });
        advance(3 * SECOND - 1);
        expect(result.current).toEqual({ phase: 'reconnected' });
        advance(1);
        expect(result.current).toEqual({ phase: 'connected' });
    });

    it('is reconnecting again when a cause comes back while reconnected', () => {
        const { result, update } = renderConnectionStatus();

        update({ liveKit: ConnectionState.Reconnecting });
        update({});
        advance(SECOND);
        update({ connection: [setIsWebsocketReconnecting(true)] });

        expect(result.current).toEqual({ phase: 'reconnecting', cause: 'meetingServer' });
        advance(3 * SECOND);
        expect(result.current).toEqual({ phase: 'reconnecting', cause: 'meetingServer' });
    });

    it('is disconnected, never reconnected, when the full rejoin fails', () => {
        const { result, update } = renderConnectionStatus();

        update({ connection: [setIsReconnecting(true)], liveKit: null });
        update({ connection: [setReconnectionFailed(true)], liveKit: null });

        expect(result.current).toEqual({ phase: 'disconnected' });
        advance(3 * SECOND);
        expect(result.current).toEqual({ phase: 'disconnected' });
    });

    it('is connected, not reconnected, when the failure clears without a rejoin', () => {
        const { result, update } = renderConnectionStatus();

        update({ connection: [setIsReconnecting(true)], liveKit: null });
        update({ connection: [setReconnectionFailed(true)], liveKit: null });
        update({ liveKit: null });

        expect(result.current).toEqual({ phase: 'connected' });
    });

    it('is reconnected after rejoining from the connection lost modal', () => {
        const { result, update } = renderConnectionStatus();

        update({ connection: [setReconnectionFailed(true)], liveKit: null });
        update({ connection: [setIsReconnecting(true)], liveKit: null });
        expect(result.current).toEqual({ phase: 'reconnecting', cause: 'fullRejoin' });

        update({ connection: [setJoinedRoom(true)], liveKit: null });

        expect(result.current).toEqual({ phase: 'reconnected' });
    });
});
