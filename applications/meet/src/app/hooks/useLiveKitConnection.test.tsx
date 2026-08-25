import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { useRoomContext } from '@livekit/components-react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { deviceManagementReducer, setPermissions } from '@proton/meet/store/slices/deviceManagementSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';
import { isFirefox } from '@proton/shared/lib/helpers/browser';

import { checkIfUsingTurnRelay } from '../utils/checkIfUsingTurnRelay';
import { useLiveKitConnection } from './useLiveKitConnection';

vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
}));

vi.mock('@proton/shared/lib/helpers/browser', () => ({
    isFirefox: vi.fn().mockReturnValue(false),
}));

vi.mock('../utils/checkIfUsingTurnRelay', () => ({
    checkIfUsingTurnRelay: vi.fn().mockResolvedValue(false),
}));

// LiveKit error strings that our fallback logic keys off of.
const signalError = () => new Error('could not establish signal connection: whatever');
const pcError = () => new Error('could not establish pc connection');
const timeoutError = () => new Error('Connection timeout after 20000ms');
const unrelatedError = () => new Error('some unrelated failure');

const mockRoom = {
    connect: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined),
};

const useRoomContextMock = useRoomContext as unknown as Mock;
const isFirefoxMock = isFirefox as unknown as Mock;
const checkIfUsingTurnRelayMock = checkIfUsingTurnRelay as unknown as Mock;

const createTestStore = () =>
    configureStore({
        reducer: { ...deviceManagementReducer },
    });

type TestStore = ReturnType<typeof createTestStore>;

const createWrapper = (store: TestStore) =>
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        );
    };

const URL = 'wss://sfu.example';
const TOKEN = 'access-token';
const TIMEOUT = 20_000;

const isRelayOptions = (options: any) => options?.rtcConfig?.iceTransportPolicy === 'relay';

describe('useLiveKitConnection', () => {
    let store: TestStore;

    const renderConnection = () =>
        renderHook(
            () =>
                useLiveKitConnection({
                    reportMeetError: vi.fn(),
                }),
            { wrapper: createWrapper(store) }
        );

    const setPermissionState = (state: 'granted' | 'denied' | 'prompt') => {
        store.dispatch(setPermissions({ camera: state, microphone: state }));
    };

    beforeEach(() => {
        vi.clearAllMocks();
        isFirefoxMock.mockReturnValue(false);
        checkIfUsingTurnRelayMock.mockResolvedValue(false);
        mockRoom.connect.mockReset();
        mockRoom.disconnect.mockReset().mockResolvedValue(undefined);
        useRoomContextMock.mockReturnValue(mockRoom);
        store = createTestStore();
    });

    describe('normal (STUN-first) path', () => {
        it('connects directly without forcing relay when the direct path succeeds', async () => {
            setPermissionState('granted');
            mockRoom.connect.mockResolvedValueOnce(undefined);

            const { result } = renderConnection();

            let info: any;
            await act(async () => {
                info = await result.current.connectWithStunFallbackToTurnRelay(URL, TOKEN, TIMEOUT);
            });

            expect(mockRoom.connect).toHaveBeenCalledTimes(1);
            expect(isRelayOptions(mockRoom.connect.mock.calls[0][2])).toBe(false);
            expect(info).toEqual({ stunFailed: false, connectionAttempts: 1 });
        });

        it('falls back to TURN relay on a post-signaling ICE/PeerConnection failure (gap #2)', async () => {
            setPermissionState('granted');
            mockRoom.connect.mockRejectedValueOnce(pcError()).mockResolvedValueOnce(undefined);

            const { result } = renderConnection();

            let info: any;
            await act(async () => {
                info = await result.current.connectWithStunFallbackToTurnRelay(URL, TOKEN, TIMEOUT);
            });

            expect(mockRoom.connect).toHaveBeenCalledTimes(2);
            expect(isRelayOptions(mockRoom.connect.mock.calls[0][2])).toBe(false);
            expect(isRelayOptions(mockRoom.connect.mock.calls[1][2])).toBe(true);
            expect(info).toEqual({ stunFailed: true, connectionAttempts: 2 });
            expect(result.current.isUsingTurnRelay).toBe(true);
        });

        it('falls back to TURN relay on a signal connection failure', async () => {
            setPermissionState('granted');
            mockRoom.connect.mockRejectedValueOnce(signalError()).mockResolvedValueOnce(undefined);

            const { result } = renderConnection();

            await act(async () => {
                await result.current.connectWithStunFallbackToTurnRelay(URL, TOKEN, TIMEOUT);
            });

            expect(mockRoom.connect).toHaveBeenCalledTimes(2);
            expect(isRelayOptions(mockRoom.connect.mock.calls[1][2])).toBe(true);
        });

        it('re-throws unrelated errors without attempting a relay fallback', async () => {
            setPermissionState('granted');
            mockRoom.connect.mockRejectedValueOnce(unrelatedError());

            const { result } = renderConnection();

            await act(async () => {
                await expect(result.current.connectWithStunFallbackToTurnRelay(URL, TOKEN, TIMEOUT)).rejects.toThrow(
                    'some unrelated failure'
                );
            });

            expect(mockRoom.connect).toHaveBeenCalledTimes(1);
        });
    });

    describe('Firefox without media permission (forced relay) path', () => {
        beforeEach(() => {
            isFirefoxMock.mockReturnValue(true);
        });

        it('forces a TURN relay connection when it succeeds', async () => {
            setPermissionState('denied');
            mockRoom.connect.mockResolvedValueOnce(undefined);

            const { result } = renderConnection();

            let info: any;
            await act(async () => {
                info = await result.current.connectWithStunFallbackToTurnRelay(URL, TOKEN, TIMEOUT);
            });

            expect(mockRoom.connect).toHaveBeenCalledTimes(1);
            expect(isRelayOptions(mockRoom.connect.mock.calls[0][2])).toBe(true);
            expect(info).toEqual({ stunFailed: false, connectionAttempts: 1 });
            expect(result.current.isUsingTurnRelay).toBe(true);
        });

        it('falls back to a direct connection when the forced relay fails (gap #1)', async () => {
            setPermissionState('denied');
            mockRoom.connect.mockRejectedValueOnce(pcError()).mockResolvedValueOnce(undefined);
            checkIfUsingTurnRelayMock.mockResolvedValue(false);

            const { result } = renderConnection();

            let info: any;
            await act(async () => {
                info = await result.current.connectWithStunFallbackToTurnRelay(URL, TOKEN, TIMEOUT);
            });

            expect(mockRoom.connect).toHaveBeenCalledTimes(2);
            expect(isRelayOptions(mockRoom.connect.mock.calls[0][2])).toBe(true);
            expect(isRelayOptions(mockRoom.connect.mock.calls[1][2])).toBe(false);
            expect(info).toEqual({ stunFailed: true, connectionAttempts: 2 });
        });

        it('re-throws unrelated errors from the forced relay without a direct fallback', async () => {
            setPermissionState('denied');
            mockRoom.connect.mockRejectedValueOnce(unrelatedError());

            const { result } = renderConnection();

            await act(async () => {
                await expect(result.current.connectWithStunFallbackToTurnRelay(URL, TOKEN, TIMEOUT)).rejects.toThrow(
                    'some unrelated failure'
                );
            });

            expect(mockRoom.connect).toHaveBeenCalledTimes(1);
        });

        it('takes the normal STUN-first path when Firefox has media permission granted', async () => {
            setPermissionState('granted');
            mockRoom.connect.mockResolvedValueOnce(undefined);

            const { result } = renderConnection();

            await act(async () => {
                await result.current.connectWithStunFallbackToTurnRelay(URL, TOKEN, TIMEOUT);
            });

            expect(mockRoom.connect).toHaveBeenCalledTimes(1);
            expect(isRelayOptions(mockRoom.connect.mock.calls[0][2])).toBe(false);
        });
    });

    it('disconnects before retrying with relay on our own connection timeout', async () => {
        setPermissionState('granted');
        mockRoom.connect.mockRejectedValueOnce(timeoutError()).mockResolvedValueOnce(undefined);

        const { result } = renderConnection();

        await act(async () => {
            await result.current.connectWithStunFallbackToTurnRelay(URL, TOKEN, TIMEOUT);
        });

        expect(mockRoom.disconnect).toHaveBeenCalled();
        expect(mockRoom.connect).toHaveBeenCalledTimes(2);
        expect(isRelayOptions(mockRoom.connect.mock.calls[1][2])).toBe(true);
    });
});
