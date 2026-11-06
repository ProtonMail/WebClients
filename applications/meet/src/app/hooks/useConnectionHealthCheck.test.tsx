import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { ConnectionStateInfo } from '@proton-meet/proton-meet-core';
import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, renderHook } from '@testing-library/react';

import type { MeetState } from '@proton/meet/store/rootReducer';
import {
    connectionReducer,
    selectIsWebsocketReconnecting,
    setIsWebsocketReconnecting,
} from '@proton/meet/store/slices/connectionSlice';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { MeetCoreClientContext } from '../contexts/MeetCoreClientContext';
import { type MeetCoreClientMock, createMeetCoreClientMock } from '../wasm/__mocks__/MeetCoreClient.mock';
import { MeetCoreRestartedError } from '../wasm/meetCoreStallRecovery';
import { useConnectionHealthCheck } from './useConnectionHealthCheck';

const reportMeetError = vi.fn();

vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError }),
}));

let isServerConnectionBannerFlagEnabled = true;

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: (name: string) =>
        name === 'MeetShowReconnectionBannerIfServerConnectionLost' && isServerConnectionBannerFlagEnabled,
}));

const WEBSOCKET_POLL_INTERVAL_MS = 2_000;

const createStore = () => configureStore({ reducer: { ...connectionReducer } });

type TestStore = ReturnType<typeof createStore>;

const createWrapper = (store: TestStore, meetCoreClient: MeetCoreClientMock) =>
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <Provider context={ProtonStoreContext} store={store}>
                <MeetCoreClientContext.Provider value={meetCoreClient}>{children}</MeetCoreClientContext.Provider>
            </Provider>
        );
    };

describe('useConnectionHealthCheck websocket state', () => {
    let store: TestStore;
    let meetCoreClient: MeetCoreClientMock;
    let dispatchSpy: ReturnType<typeof vi.spyOn>;

    const isWebsocketReconnecting = () => selectIsWebsocketReconnecting(store.getState() as MeetState);

    const renderHealthCheck = () =>
        renderHook(
            () =>
                useConnectionHealthCheck({
                    mlsGroupStateRef: { current: null },
                    onMlsFailed: vi.fn(),
                }),
            { wrapper: createWrapper(store, meetCoreClient) }
        );

    const advancePoll = async () => {
        await act(async () => {
            await vi.advanceTimersByTimeAsync(WEBSOCKET_POLL_INTERVAL_MS);
        });
    };

    const renderAllowedHealthCheck = async (state: ConnectionStateInfo) => {
        meetCoreClient.getWsState.mockResolvedValue(state);
        const rendered = renderHealthCheck();
        act(() => rendered.result.current.allowHealthCheck());
        await advancePoll();
        return rendered;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        isServerConnectionBannerFlagEnabled = true;
        store = createStore();
        dispatchSpy = vi.spyOn(store, 'dispatch');
        meetCoreClient = createMeetCoreClientMock({
            isMlsUpToDate: vi.fn().mockResolvedValue(true),
            getWsState: vi.fn().mockResolvedValue(ConnectionStateInfo.Connected),
        });
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it.each([
        { name: 'Reconnecting', state: ConnectionStateInfo.Reconnecting, expected: true },
        { name: 'Connecting', state: ConnectionStateInfo.Connecting, expected: true },
        { name: 'Connected', state: ConnectionStateInfo.Connected, expected: false },
        { name: 'Disconnected', state: ConnectionStateInfo.Disconnected, expected: true },
    ])('reports the $name core state as reconnecting: $expected', async ({ state, expected }) => {
        await renderAllowedHealthCheck(state);

        expect(isWebsocketReconnecting()).toBe(expected);
    });

    it('stops reporting reconnecting once the core is connected again', async () => {
        await renderAllowedHealthCheck(ConnectionStateInfo.Reconnecting);
        expect(isWebsocketReconnecting()).toBe(true);

        meetCoreClient.getWsState.mockResolvedValue(ConnectionStateInfo.Connected);
        await advancePoll();

        expect(isWebsocketReconnecting()).toBe(false);
    });

    it('does not poll or report while the health check is not allowed', async () => {
        meetCoreClient.getWsState.mockResolvedValue(ConnectionStateInfo.Reconnecting);
        renderHealthCheck();

        await advancePoll();
        await advancePoll();

        expect(meetCoreClient.getWsState).not.toHaveBeenCalled();
        expect(isWebsocketReconnecting()).toBe(false);
    });

    it('does not poll or report while the feature flag is off', async () => {
        isServerConnectionBannerFlagEnabled = false;
        await renderAllowedHealthCheck(ConnectionStateInfo.Reconnecting);
        await advancePoll();

        expect(meetCoreClient.getWsState).not.toHaveBeenCalled();
        expect(isWebsocketReconnecting()).toBe(false);
    });

    it('clears reconnecting and stops polling once the feature flag turns off', async () => {
        const { rerender } = await renderAllowedHealthCheck(ConnectionStateInfo.Reconnecting);
        expect(isWebsocketReconnecting()).toBe(true);

        isServerConnectionBannerFlagEnabled = false;
        rerender();
        meetCoreClient.getWsState.mockClear();
        await advancePoll();
        expect(isWebsocketReconnecting()).toBe(false);

        await advancePoll();
        expect(meetCoreClient.getWsState).not.toHaveBeenCalled();
        expect(isWebsocketReconnecting()).toBe(false);
    });

    it('clears reconnecting and stops reporting once the health check is disallowed', async () => {
        const { result } = await renderAllowedHealthCheck(ConnectionStateInfo.Reconnecting);
        expect(isWebsocketReconnecting()).toBe(true);

        act(() => result.current.disallowHealthCheck());
        expect(isWebsocketReconnecting()).toBe(false);

        await advancePoll();
        expect(isWebsocketReconnecting()).toBe(false);
    });

    it('ignores a poll that resolves after the health check was disallowed', async () => {
        let resolveWsState: (state: ConnectionStateInfo) => void = () => {};
        meetCoreClient.getWsState.mockReturnValue(
            new Promise<ConnectionStateInfo>((resolve) => {
                resolveWsState = resolve;
            })
        );
        const { result } = renderHealthCheck();
        act(() => result.current.allowHealthCheck());
        await advancePoll();

        act(() => result.current.disallowHealthCheck());
        await act(async () => {
            resolveWsState(ConnectionStateInfo.Reconnecting);
        });

        expect(isWebsocketReconnecting()).toBe(false);
    });

    it('ignores a poll that resolves after unmount', async () => {
        let resolveWsState: (state: ConnectionStateInfo) => void = () => {};
        meetCoreClient.getWsState.mockReturnValue(
            new Promise<ConnectionStateInfo>((resolve) => {
                resolveWsState = resolve;
            })
        );
        const { result, unmount } = renderHealthCheck();
        act(() => result.current.allowHealthCheck());
        await advancePoll();

        unmount();
        await act(async () => {
            resolveWsState(ConnectionStateInfo.Reconnecting);
        });

        expect(isWebsocketReconnecting()).toBe(false);
    });

    it('reports reconnecting again after a disallow and a new allow', async () => {
        const { result } = await renderAllowedHealthCheck(ConnectionStateInfo.Reconnecting);

        act(() => result.current.disallowHealthCheck());
        act(() => result.current.allowHealthCheck());
        await advancePoll();

        expect(isWebsocketReconnecting()).toBe(true);
    });

    it('does not dispatch again while the polled state is unchanged', async () => {
        await renderAllowedHealthCheck(ConnectionStateInfo.Reconnecting);
        await advancePoll();
        await advancePoll();

        expect(dispatchSpy.mock.calls).toEqual([
            [setIsWebsocketReconnecting(false)],
            [setIsWebsocketReconnecting(true)],
        ]);
    });

    it('starts from connected when allowed again without a disallow in between', async () => {
        const { result } = await renderAllowedHealthCheck(ConnectionStateInfo.Disconnected);
        expect(isWebsocketReconnecting()).toBe(true);

        meetCoreClient.getWsState.mockResolvedValue(ConnectionStateInfo.Connected);
        act(() => result.current.allowHealthCheck());

        expect(isWebsocketReconnecting()).toBe(false);
    });

    it('keeps a value set elsewhere while the core stays connected', async () => {
        await renderAllowedHealthCheck(ConnectionStateInfo.Connected);

        act(() => {
            store.dispatch(setIsWebsocketReconnecting(true));
        });
        await advancePoll();

        expect(isWebsocketReconnecting()).toBe(true);
    });

    it('reports a failed poll and keeps the last value', async () => {
        await renderAllowedHealthCheck(ConnectionStateInfo.Reconnecting);

        meetCoreClient.getWsState.mockRejectedValue(new Error('worker gone'));
        await advancePoll();

        expect(reportMeetError).toHaveBeenCalledWith('Failed to get websocket state', expect.any(Error));
        expect(isWebsocketReconnecting()).toBe(true);
    });

    it('does not report a poll dropped by a meet-core restart', async () => {
        await renderAllowedHealthCheck(ConnectionStateInfo.Connected);

        meetCoreClient.getWsState.mockRejectedValue(new MeetCoreRestartedError());
        await advancePoll();

        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('keeps polling the websocket state while the MLS check hangs', async () => {
        meetCoreClient.isMlsUpToDate.mockReturnValue(new Promise(() => {}));
        await renderAllowedHealthCheck(ConnectionStateInfo.Connected);

        meetCoreClient.getWsState.mockResolvedValue(ConnectionStateInfo.Reconnecting);
        await advancePoll();

        expect(isWebsocketReconnecting()).toBe(true);
    });
});
