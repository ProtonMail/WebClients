import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setDevicesInitializing } from '@proton/meet/store/slices/deviceManagementSlice';
import {
    selectActiveCameraId,
    selectSelectedCameraId,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';

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

const dispatchMock = vi.hoisted(() => vi.fn());
const storeState = vi.hoisted(() => ({ connection: { joinedRoom: true } }));
const storeMocks = vi.hoisted(() => ({
    useMeetDispatch: () => dispatchMock,
    useMeetSelector: vi.fn((_selector: unknown): unknown => undefined),
    useMeetStore: () => ({ getState: () => storeState }),
}));
vi.mock('@proton/meet/store/hooks', () => storeMocks);

vi.mock('@proton/meet/telemetry/meetTelemetry', () => ({
    TelemetryMeetActionsEvents: { camera_rotated: 'camera_rotated' },
    sendMeetActionsEvent: vi.fn(),
}));

const browserMocks = vi.hoisted(() => ({
    isMobile: vi.fn(),
    isFirefox: vi.fn(),
    isAndroid: vi.fn(),
}));
vi.mock('@proton/shared/lib/helpers/browser', () => browserMocks);

const mockBrowser = ({ mobile = false, firefox = false, android = false } = {}) => {
    browserMocks.isMobile.mockReturnValue(mobile);
    browserMocks.isFirefox.mockReturnValue(firefox);
    browserMocks.isAndroid.mockReturnValue(android);
};

beforeEach(() => {
    mockBrowser();
});

const dummyMocks = vi.hoisted(() => ({
    isDummyVideoTrack: vi.fn(),
    markVideoTrackDeviceBacked: vi.fn(),
}));
vi.mock('../../../utils/dummyVideoTrack', () => dummyMocks);

const enableDeviceTrackMock = vi.hoisted(() => ({ enableDeviceTrack: vi.fn() }));
vi.mock('../../../utils/enableDeviceTrack', () => enableDeviceTrackMock);

const setup = (isDummy: boolean, selectedCameraId?: string, activeCameraId?: string) => {
    storeMocks.useMeetSelector.mockImplementation((selector: unknown) => {
        if (selector === selectSelectedCameraId) {
            return selectedCameraId;
        }
        return selector === selectActiveCameraId ? activeCameraId : undefined;
    });

    const track = {
        stopProcessor: vi.fn().mockResolvedValue(undefined),
        restartTrack: vi.fn().mockResolvedValue(undefined),
        unmute: vi.fn().mockResolvedValue(undefined),
        getProcessor: vi.fn(),
        setProcessor: vi.fn().mockResolvedValue(undefined),
        isMuted: false,
        mediaStreamTrack: { readyState: 'live', enabled: true },
    };

    const trackPublications = new Map([['cam', { kind: 'video', source: 'camera', track }]]);
    const localParticipant = {
        trackPublications,
        setCameraEnabled: vi.fn().mockResolvedValue(undefined),
        unpublishTrack: vi.fn(async () => {
            trackPublications.clear();
        }),
        on: vi.fn(),
        off: vi.fn(),
    };
    const room = { localParticipant, state: 'connected', on: vi.fn(), off: vi.fn() };

    livekitReact.useRoomContext.mockReturnValue(room);
    livekitReact.useLocalParticipant.mockReturnValue({ isCameraEnabled: false, localParticipant });
    dummyMocks.isDummyVideoTrack.mockReturnValue(isDummy);

    const switchActiveDevice = vi.fn().mockResolvedValue(undefined);
    const reapplyBackgroundEffect = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useVideoToggle({ switchActiveDevice, reapplyBackgroundEffect }));

    return { result, track, localParticipant, room, reapplyBackgroundEffect };
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

describe('useVideoToggle — republishing the camera', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('unpublishes the camera, then publishes a new one and puts the background effect back', async () => {
        const { result, track, localParticipant, reapplyBackgroundEffect } = setup(false, undefined, 'device-1');
        enableDeviceTrackMock.enableDeviceTrack.mockResolvedValue(true);

        let republished: boolean | undefined;
        await act(async () => {
            republished = await result.current.republishCamera();
        });

        expect(republished).toBe(true);
        expect(localParticipant.unpublishTrack).toHaveBeenCalledWith(track);
        expect(enableDeviceTrackMock.enableDeviceTrack).toHaveBeenCalledWith(
            localParticipant,
            { source: 'camera', options: { deviceId: { exact: 'device-1' } } },
            expect.any(Function)
        );
        expect(reapplyBackgroundEffect).toHaveBeenCalledWith(true);
    });

    it('shows the camera as starting until the new camera is published', async () => {
        const { result } = setup(false, undefined, 'device-1');
        let publish: (published: boolean) => void = () => {};
        enableDeviceTrackMock.enableDeviceTrack.mockReturnValueOnce(
            new Promise<boolean>((resolve) => {
                publish = resolve;
            })
        );

        let republishing: Promise<boolean> | undefined;
        await act(async () => {
            republishing = result.current.republishCamera();
        });

        expect(dispatchMock).toHaveBeenCalledWith(setDevicesInitializing({ camera: true }));
        expect(dispatchMock).not.toHaveBeenCalledWith(setDevicesInitializing({ camera: false }));

        await act(async () => {
            publish(true);
            await republishing;
        });

        expect(dispatchMock).toHaveBeenLastCalledWith(setDevicesInitializing({ camera: false }));
    });

    it.each([
        {
            name: 'the user left during the unpublish',
            prepare: (localParticipant: { unpublishTrack: Mock }, room: { state: string }) =>
                localParticipant.unpublishTrack.mockImplementationOnce(async () => {
                    room.state = 'disconnected';
                }),
        },
        {
            name: 'the unpublish failed',
            prepare: (localParticipant: { unpublishTrack: Mock }) =>
                localParticipant.unpublishTrack.mockRejectedValueOnce(new Error('unpublish failed')),
        },
    ])('stops showing the camera as starting when $name', async ({ prepare }) => {
        const { result, localParticipant, room } = setup(false, undefined, 'device-1');
        prepare(localParticipant, room);

        await act(async () => {
            await result.current.republishCamera();
        });

        expect(dispatchMock).toHaveBeenCalledWith(setDevicesInitializing({ camera: true }));
        expect(dispatchMock).toHaveBeenLastCalledWith(setDevicesInitializing({ camera: false }));
    });

    it('does not open the camera again when the user left during the unpublish', async () => {
        const { result, localParticipant, room } = setup(false, undefined, 'device-1');
        localParticipant.unpublishTrack.mockImplementationOnce(async () => {
            room.state = 'disconnected';
        });

        let republished: boolean | undefined;
        await act(async () => {
            republished = await result.current.republishCamera();
        });

        expect(republished).toBe(false);
        expect(enableDeviceTrackMock.enableDeviceTrack).not.toHaveBeenCalled();
        expect(localParticipant.setCameraEnabled).not.toHaveBeenCalled();
    });

    it('does not open the camera again when the user left while the room still reads connected', async () => {
        const { result, localParticipant } = setup(false, undefined, 'device-1');
        localParticipant.unpublishTrack.mockImplementationOnce(async () => {
            storeState.connection.joinedRoom = false;
        });

        let republished: boolean | undefined;
        await act(async () => {
            republished = await result.current.republishCamera();
        });
        storeState.connection.joinedRoom = true;

        expect(republished).toBe(false);
        expect(enableDeviceTrackMock.enableDeviceTrack).not.toHaveBeenCalled();
    });

    it('stops at a camera that answered after the user left the joined room', async () => {
        const { result } = setup(false, undefined, 'device-1');
        enableDeviceTrackMock.enableDeviceTrack.mockResolvedValue(true);

        await act(async () => {
            await result.current.republishCamera();
        });
        const hasLeftMeeting = enableDeviceTrackMock.enableDeviceTrack.mock.calls[0][2] as () => boolean;
        expect(hasLeftMeeting()).toBe(false);
        storeState.connection.joinedRoom = false;
        expect(hasLeftMeeting()).toBe(true);
        storeState.connection.joinedRoom = true;
    });

    it.each`
        case                            | isDummy  | isMuted  | activeCameraId
        ${'the camera is a dummy'}      | ${true}  | ${false} | ${'device-1'}
        ${'the camera is muted'}        | ${false} | ${true}  | ${'device-1'}
        ${'no camera device is active'} | ${false} | ${false} | ${undefined}
    `('leaves the camera published when $case', async ({ isDummy, isMuted, activeCameraId }) => {
        const { result, track, localParticipant } = setup(isDummy, undefined, activeCameraId);
        track.isMuted = isMuted;

        let republished: boolean | undefined;
        await act(async () => {
            republished = await result.current.republishCamera();
        });

        expect(republished).toBe(false);
        expect(localParticipant.unpublishTrack).not.toHaveBeenCalled();
        expect(dispatchMock).not.toHaveBeenCalledWith(setDevicesInitializing({ camera: true }));
    });

    it('leaves the camera published while a camera toggle is in progress', async () => {
        const { result, localParticipant } = setup(false, undefined, 'device-1');
        let finishSwitch: () => void = () => {};
        localParticipant.setCameraEnabled.mockReturnValueOnce(
            new Promise<void>((resolve) => {
                finishSwitch = resolve;
            })
        );

        let republished: boolean | undefined;
        await act(async () => {
            const toggle = result.current.toggleVideo({ isEnabled: true, updateUserIntent: false });
            republished = await result.current.republishCamera();
            finishSwitch();
            await toggle;
        });

        expect(republished).toBe(false);
        expect(localParticipant.unpublishTrack).not.toHaveBeenCalled();
    });
});

describe('useVideoToggle — leaving while the camera starts', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('stops at a camera that answered after the user left', async () => {
        const { result, localParticipant, reapplyBackgroundEffect } = setup(false);
        const hasLeftMeeting = () => true;
        enableDeviceTrackMock.enableDeviceTrack.mockResolvedValue(false);

        let toggleResult: boolean | undefined;
        await act(async () => {
            toggleResult = await result.current.toggleVideo({
                isEnabled: true,
                videoDeviceId: 'device-1',
                updateUserIntent: false,
                hasLeftMeeting,
            });
        });

        expect(enableDeviceTrackMock.enableDeviceTrack).toHaveBeenCalledWith(
            localParticipant,
            { source: 'camera', options: { deviceId: { exact: 'device-1' } } },
            hasLeftMeeting
        );
        expect(localParticipant.setCameraEnabled).not.toHaveBeenCalled();
        expect(reapplyBackgroundEffect).not.toHaveBeenCalled();
        expect(toggleResult).toBe(false);
    });
});

describe('useVideoToggle — background effects', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('puts the effect back once the camera has been switched', async () => {
        const { result, track, reapplyBackgroundEffect } = setup(false);

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: true, videoDeviceId: 'device-1', updateUserIntent: false });
        });

        // The old processor has to be off the track before the new device is opened, so the
        // effect can only be put back afterwards.
        expect(track.stopProcessor).toHaveBeenCalled();
        expect(reapplyBackgroundEffect).toHaveBeenCalledWith(true);
    });

    it('reports the camera as off so a stopped track is left alone', async () => {
        const { result, reapplyBackgroundEffect } = setup(false);

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: false, videoDeviceId: 'device-1', updateUserIntent: false });
        });

        expect(reapplyBackgroundEffect).toHaveBeenCalledWith(false);
    });
});

describe('useVideoToggle — camera size on Firefox for Android', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('asks a phone camera for its native size', async () => {
        mockBrowser({ mobile: true, firefox: true, android: true });
        const { result, localParticipant } = setup(false);

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: true, updateUserIntent: false });
        });

        expect(localParticipant.setCameraEnabled).toHaveBeenCalledWith(true, {
            facingMode: 'user',
            resizeMode: 'none',
        });
    });

    it('asks a tablet camera for its native size', async () => {
        mockBrowser({ mobile: false, firefox: true, android: true });
        const { result, localParticipant } = setup(false);

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: true, videoDeviceId: 'device-1', updateUserIntent: false });
        });

        expect(localParticipant.setCameraEnabled).toHaveBeenCalledWith(true, {
            deviceId: { exact: 'device-1' },
            resizeMode: 'none',
        });
    });

    it('asks the camera opened at join for its native size', async () => {
        mockBrowser({ mobile: true, firefox: true, android: true });
        const { result, localParticipant } = setup(false);
        const hasLeftMeeting = () => false;
        enableDeviceTrackMock.enableDeviceTrack.mockResolvedValue(true);

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: true, updateUserIntent: false, hasLeftMeeting });
        });

        expect(enableDeviceTrackMock.enableDeviceTrack).toHaveBeenCalledWith(
            localParticipant,
            { source: 'camera', options: { facingMode: 'user', resizeMode: 'none' } },
            hasLeftMeeting
        );
    });

    it('asks for the native size again when the camera is flipped', async () => {
        mockBrowser({ mobile: true, firefox: true, android: true });
        const { result, track } = setup(false);

        await act(async () => {
            await result.current.handleRotateCamera();
        });

        expect(track.restartTrack).toHaveBeenCalledWith({ facingMode: 'environment', resizeMode: 'none' });
    });

    it.each([
        {
            name: 'Chrome on an Android phone',
            browser: { mobile: true, android: true },
            expected: { facingMode: 'user' },
        },
        { name: 'Firefox on desktop', browser: { firefox: true }, expected: { deviceId: { exact: 'device-1' } } },
    ])('leaves the camera size to $name', async ({ browser, expected }) => {
        mockBrowser(browser);
        const { result, localParticipant } = setup(false);

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: true, videoDeviceId: 'device-1', updateUserIntent: false });
        });

        expect(localParticipant.setCameraEnabled.mock.calls[0][1]).toStrictEqual(expected);
    });
});
