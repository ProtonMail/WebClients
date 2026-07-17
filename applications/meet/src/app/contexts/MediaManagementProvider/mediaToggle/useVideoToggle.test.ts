import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { selectSelectedCameraId } from '@proton/meet/store/slices/deviceManagementSlice/selectors';

import { useVideoToggle } from './useVideoToggle';

vi.mock('livekit-client', () => ({
    ConnectionState: { Connected: 'connected', Disconnected: 'disconnected' },
    RoomEvent: { LocalTrackPublished: 'localTrackPublished' },
    Track: {
        Kind: { Video: 'video', Audio: 'audio' },
        Source: { Camera: 'camera', ScreenShare: 'screen_share' },
    },
}));

const livekitReact = vi.hoisted(() => ({
    useLocalParticipant: vi.fn(),
    useRoomContext: vi.fn(),
}));
vi.mock('@livekit/components-react', () => livekitReact);

vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError: vi.fn() }),
}));

const storeMocks = vi.hoisted(() => ({
    useMeetDispatch: () => vi.fn(),
    useMeetSelector: vi.fn((_selector: unknown): unknown => undefined),
    useMeetStore: () => ({ getState: () => ({}) }),
}));
vi.mock('@proton/meet/store/hooks', () => storeMocks);

vi.mock('@proton/shared/lib/helpers/browser', () => ({ isMobile: () => false }));

vi.mock('../../../processors/background-processor/createBackgroundProcessor', () => ({
    createBackgroundProcessor: vi.fn(() => null),
    ensureBackgroundBlurProcessor: vi.fn(),
}));

vi.mock('../../../utils/backgroundBlurPersistance', () => ({
    getPersistedBackgroundBlur: () => false,
    persistBackgroundBlur: vi.fn(),
}));

const dummyMocks = vi.hoisted(() => ({
    isDummyVideoTrack: vi.fn(),
    markVideoTrackDeviceBacked: vi.fn(),
}));
vi.mock('../../../utils/dummyVideoTrack', () => dummyMocks);

const setup = (isDummy: boolean, selectedCameraId?: string) => {
    storeMocks.useMeetSelector.mockImplementation((selector: unknown) =>
        selector === selectSelectedCameraId ? selectedCameraId : undefined
    );

    const track = {
        stopProcessor: vi.fn().mockResolvedValue(undefined),
        restartTrack: vi.fn().mockResolvedValue(undefined),
        unmute: vi.fn().mockResolvedValue(undefined),
    };

    const localParticipant = {
        trackPublications: new Map([['cam', { kind: 'video', source: 'camera', track }]]),
        setCameraEnabled: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        off: vi.fn(),
    };
    const room = { localParticipant, state: 'connected', on: vi.fn(), off: vi.fn() };

    livekitReact.useRoomContext.mockReturnValue(room);
    livekitReact.useLocalParticipant.mockReturnValue({ isCameraEnabled: false, localParticipant });
    dummyMocks.isDummyVideoTrack.mockReturnValue(isDummy);

    const switchActiveDevice = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
        useVideoToggle({
            switchActiveDevice,
            backgroundProcessorVersion: 'current',
            trackBlurInitialization: vi.fn(),
            cancelBlurInitialization: vi.fn(),
        })
    );

    return { result, track, localParticipant };
};

describe('useVideoToggle — placeholder track swap', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('swaps the placeholder for the real camera in place when enabling from a dummy track', async () => {
        const { result, track, localParticipant } = setup(true);

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: true, videoDeviceId: 'device-1', updateUserIntent: false });
        });

        expect(track.restartTrack).toHaveBeenCalledWith({ deviceId: { exact: 'device-1' } });
        expect(track.unmute).toHaveBeenCalled();
        expect(dummyMocks.markVideoTrackDeviceBacked).toHaveBeenCalledWith(track);
        expect(localParticipant.setCameraEnabled).not.toHaveBeenCalled();
    });

    it('restarts to the selected camera, not the passed deviceId', async () => {
        const { result, track } = setup(true, 'device-2');

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: true, videoDeviceId: 'device-1', updateUserIntent: false });
        });

        expect(track.restartTrack).toHaveBeenCalledWith({ deviceId: { exact: 'device-2' } });
    });

    it('uses setCameraEnabled for a real (non-dummy) camera track', async () => {
        const { result, track, localParticipant } = setup(false);

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: true, videoDeviceId: 'device-1', updateUserIntent: false });
        });

        expect(localParticipant.setCameraEnabled).toHaveBeenCalledWith(true, { deviceId: { exact: 'device-1' } });
        expect(track.restartTrack).not.toHaveBeenCalled();
        expect(dummyMocks.markVideoTrackDeviceBacked).not.toHaveBeenCalled();
    });
});
