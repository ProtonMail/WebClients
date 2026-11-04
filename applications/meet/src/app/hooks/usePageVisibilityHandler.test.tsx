import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { isSafari } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { useCameraTrackSubscriptionManager } from '../contexts/CameraTrackSubscriptionCacheProvider/CameraTrackSubscriptionManagerProvider';
import { useMeetCoreClient } from '../contexts/MeetCoreClientContext';
import { createMeetCoreClientMock } from '../wasm/__mocks__/MeetCoreClient.mock';
import { usePageVisibilityHandler } from './usePageVisibilityHandler';

vi.mock('@proton/shared/lib/helpers/browser', () => ({
    isSafari: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

const reportMeetError = vi.fn();

vi.mock('@proton/meet', () => ({
    useMeetErrorReporting: () => ({ reportMeetError }),
}));

vi.mock('../contexts/CameraTrackSubscriptionCacheProvider/CameraTrackSubscriptionManagerProvider', () => ({
    useCameraTrackSubscriptionManager: vi.fn(),
}));

vi.mock('../contexts/MeetCoreClientContext', () => ({
    useMeetCoreClient: vi.fn(),
}));

const isSafariMock = isSafari as Mock;
const useFlagMock = useFlag as Mock;
const useCameraTrackSubscriptionManagerMock = useCameraTrackSubscriptionManager as Mock;
const useMeetCoreClientMock = useMeetCoreClient as Mock;

const setVisibility = (state: 'hidden' | 'visible') => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
    document.dispatchEvent(new Event('visibilitychange'));
};

describe('usePageVisibilityHandler', () => {
    let meetCoreClient: ReturnType<typeof createMeetCoreClientMock>;
    const unsubscribeAllVideos = vi.fn();
    const resubscribeAllVideos = vi.fn();

    const expectNoWebsocketSettingsChanged = () => {
        expect(meetCoreClient.setWebsocketPingInterval).not.toHaveBeenCalled();
        expect(meetCoreClient.setWebsocketPongTimeout).not.toHaveBeenCalled();
        expect(meetCoreClient.setWebsocketMaxPingFailures).not.toHaveBeenCalled();
    };

    const renderHandler = (isPipActive = false) =>
        renderHook(() => usePageVisibilityHandler({ joinedRoom: true, isPipActive }));

    beforeEach(() => {
        vi.useFakeTimers();
        meetCoreClient = createMeetCoreClientMock();
        unsubscribeAllVideos.mockReset().mockResolvedValue(undefined);
        resubscribeAllVideos.mockReset().mockResolvedValue(undefined);
        reportMeetError.mockReset();
        useMeetCoreClientMock.mockReturnValue(meetCoreClient);
        useCameraTrackSubscriptionManagerMock.mockReturnValue({ unsubscribeAllVideos, resubscribeAllVideos });
        isSafariMock.mockReturnValue(false);
        useFlagMock.mockImplementation((name: string) => name === 'MeetCpuOptimizations');
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not touch websocket settings outside Safari', async () => {
        renderHandler();

        setVisibility('hidden');
        await vi.advanceTimersByTimeAsync(0);
        setVisibility('visible');
        await vi.advanceTimersByTimeAsync(0);

        expectNoWebsocketSettingsChanged();
    });

    it('sets and resets websocket settings in Safari', async () => {
        isSafariMock.mockReturnValue(true);
        useFlagMock.mockReturnValue(false);
        renderHandler();

        setVisibility('hidden');
        await vi.advanceTimersByTimeAsync(0);

        expect(meetCoreClient.setWebsocketPingInterval).toHaveBeenCalledWith(60n);
        expect(meetCoreClient.setWebsocketPongTimeout).toHaveBeenCalledWith(60n);
        expect(meetCoreClient.setWebsocketMaxPingFailures).toHaveBeenCalledWith(3);

        setVisibility('visible');
        await vi.advanceTimersByTimeAsync(0);

        expect(meetCoreClient.setWebsocketPingInterval).toHaveBeenLastCalledWith(null);
        expect(meetCoreClient.setWebsocketPongTimeout).toHaveBeenLastCalledWith(null);
        expect(meetCoreClient.setWebsocketMaxPingFailures).toHaveBeenLastCalledWith(null);
    });

    it('unsubscribes videos after the debounce when hidden and resubscribes when visible outside Safari', async () => {
        renderHandler();

        setVisibility('hidden');
        await vi.advanceTimersByTimeAsync(499);
        expect(unsubscribeAllVideos).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(unsubscribeAllVideos).toHaveBeenCalledTimes(1);

        setVisibility('visible');
        await vi.advanceTimersByTimeAsync(500);
        expect(resubscribeAllVideos).toHaveBeenCalledTimes(1);
    });

    it('does nothing outside Safari when the flag is off', async () => {
        useFlagMock.mockReturnValue(false);
        renderHandler();

        setVisibility('hidden');
        await vi.advanceTimersByTimeAsync(1000);
        setVisibility('visible');
        await vi.advanceTimersByTimeAsync(1000);

        expectNoWebsocketSettingsChanged();
        expect(unsubscribeAllVideos).not.toHaveBeenCalled();
        expect(resubscribeAllVideos).not.toHaveBeenCalled();
    });

    it('does not unsubscribe videos when Picture-in-Picture is active', async () => {
        renderHandler(true);

        setVisibility('hidden');
        await vi.advanceTimersByTimeAsync(1000);

        expect(unsubscribeAllVideos).not.toHaveBeenCalled();
    });
});
