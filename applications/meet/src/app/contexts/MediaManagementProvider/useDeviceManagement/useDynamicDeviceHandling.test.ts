import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    selectActiveAudioOutputId,
    selectActiveCameraId,
    selectActiveMicrophoneId,
    selectFilteredCameras,
    selectFilteredMicrophones,
    selectFilteredSpeakers,
    selectMicrophoneState,
    selectPreferredCameraId,
    selectSpeakerState,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import type { SliceDeviceState } from '@proton/meet/store/slices/deviceManagementSlice/types';
import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';
import { filterDevices } from '@proton/meet/utils/deviceUtils';

import { useDynamicDeviceHandling } from './useDynamicDeviceHandling';

vi.mock('livekit-client', () => ({
    ConnectionState: { Connected: 'connected', Disconnected: 'disconnected' },
    Track: { Source: { Camera: 'camera' } },
    RoomEvent: { MediaDevicesError: 'mediaDevicesError' },
    MediaDeviceFailure: { getFailure: () => undefined },
}));

vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError: vi.fn() }),
}));

const livekitReact = vi.hoisted(() => ({ useRoomContext: vi.fn() }));
vi.mock('@livekit/components-react', () => livekitReact);

const storeMocks = vi.hoisted(() => ({ useMeetSelector: vi.fn((_selector: unknown): unknown => undefined) }));
vi.mock('@proton/meet/store/hooks', () => storeMocks);

const browserMocks = vi.hoisted(() => ({ supportsSetSinkId: vi.fn(() => true) }));
vi.mock('../../../utils/browser', () => browserMocks);

const DEBOUNCE_MS = 200;

const device = (deviceId: string, label: string, groupId = `group-${deviceId}`): SerializableDeviceInfo => ({
    deviceId,
    groupId,
    kind: 'audiooutput',
    label,
});

const DEFAULT_ENTRY = device('default', 'Default', 'default');

// Real device list from an Ubuntu report: the synthetic default entry has no resolvable groupId
// and the first speaker alphabetically is an HDMI port with nothing plugged into it.
const UBUNTU_SPEAKERS = [
    DEFAULT_ENTRY,
    device('hdmi-1', 'Comet Lake PCH-LP cAVS HDMI / DisplayPort 1 Output'),
    device('hdmi-2', 'Comet Lake PCH-LP cAVS HDMI / DisplayPort 2 Output'),
    device('headphones', 'Comet Lake PCH-LP cAVS Headphones'),
    device('builtin-speaker', 'Comet Lake PCH-LP cAVS Speaker'),
    device('jabra', 'Jabra Evolve2 30 Analog Stereo'),
];

const deviceState = (overrides: Partial<SliceDeviceState> = {}): SliceDeviceState => ({
    systemDefault: null,
    systemDefaultLabel: '',
    hasDefaultOption: false,
    useSystemDefault: false,
    preferredAvailable: false,
    preferredDevice: null,
    preferredDeviceId: null,
    ...overrides,
});

interface SetupOptions {
    microphones?: SerializableDeviceInfo[];
    cameras?: SerializableDeviceInfo[];
    speakers?: SerializableDeviceInfo[];
    activeMicrophoneId?: string | null;
    activeCameraId?: string | null;
    activeAudioOutputId?: string | null;
    preferredCameraId?: string | null;
    microphoneState?: SliceDeviceState;
    speakerState?: SliceDeviceState;
    isConnected?: boolean;
}

const setup = (options: SetupOptions = {}) => {
    const {
        microphones = [],
        cameras = [],
        speakers = [],
        activeMicrophoneId = null,
        activeCameraId = null,
        activeAudioOutputId = null,
        preferredCameraId = null,
        microphoneState = deviceState(),
        speakerState = deviceState(),
        isConnected = true,
    } = options;

    const selectorValues = new Map<unknown, unknown>([
        [selectFilteredMicrophones, filterDevices(microphones)],
        [selectFilteredCameras, filterDevices(cameras)],
        [selectFilteredSpeakers, filterDevices(speakers)],
        [selectActiveMicrophoneId, activeMicrophoneId],
        [selectActiveCameraId, activeCameraId],
        [selectActiveAudioOutputId, activeAudioOutputId],
        [selectPreferredCameraId, preferredCameraId],
        [selectMicrophoneState, microphoneState],
        [selectSpeakerState, speakerState],
    ]);

    storeMocks.useMeetSelector.mockImplementation((selector: unknown) => selectorValues.get(selector));

    livekitReact.useRoomContext.mockReturnValue({
        state: isConnected ? 'connected' : 'disconnected',
        localParticipant: { getTrackPublication: () => undefined, unpublishTrack: vi.fn() },
        on: vi.fn(),
        off: vi.fn(),
    });

    const switchActiveDevice = vi.fn().mockResolvedValue(undefined);
    const toggleAudio = vi.fn().mockResolvedValue(undefined);
    const toggleVideo = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(() => useDynamicDeviceHandling({ switchActiveDevice, toggleAudio, toggleVideo }));

    act(() => {
        vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    return { switchActiveDevice, toggleAudio, toggleVideo, rerender, selectorValues };
};

describe('useDynamicDeviceHandling', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('audio output', () => {
        it('does not switch when there is no resolvable system default', () => {
            const { switchActiveDevice } = setup({
                speakers: UBUNTU_SPEAKERS,
                activeAudioOutputId: '',
                speakerState: deviceState({ systemDefault: null, useSystemDefault: true }),
            });

            expect(switchActiveDevice).not.toHaveBeenCalled();
        });

        it('switches to the system default when the active speaker is gone', () => {
            const { switchActiveDevice } = setup({
                speakers: UBUNTU_SPEAKERS,
                activeAudioOutputId: 'unplugged-dock',
                speakerState: deviceState({
                    systemDefault: device('builtin-speaker', 'Comet Lake PCH-LP cAVS Speaker'),
                }),
            });

            expect(switchActiveDevice).toHaveBeenCalledWith(
                expect.objectContaining({ deviceType: 'audiooutput', deviceId: 'builtin-speaker' })
            );
        });

        it('falls back to the first device when the system default is not in the list', () => {
            const { switchActiveDevice } = setup({
                speakers: UBUNTU_SPEAKERS,
                activeAudioOutputId: 'unplugged-dock',
                speakerState: deviceState({ systemDefault: device('monitor-source', 'Monitor of Something') }),
            });

            expect(switchActiveDevice).toHaveBeenCalledWith(
                expect.objectContaining({ deviceType: 'audiooutput', deviceId: 'hdmi-1' })
            );
        });

        it('switches to the preferred speaker when it is available', () => {
            const { switchActiveDevice } = setup({
                speakers: UBUNTU_SPEAKERS,
                activeAudioOutputId: 'builtin-speaker',
                speakerState: deviceState({ preferredDeviceId: 'jabra' }),
            });

            expect(switchActiveDevice).toHaveBeenCalledWith(
                expect.objectContaining({ deviceType: 'audiooutput', deviceId: 'jabra' })
            );
        });

        it('does nothing when the active speaker is still available', () => {
            const { switchActiveDevice } = setup({
                speakers: UBUNTU_SPEAKERS,
                activeAudioOutputId: 'jabra',
            });

            expect(switchActiveDevice).not.toHaveBeenCalled();
        });

        it('follows the system default when it changes and the device list stays the same', () => {
            const { switchActiveDevice, rerender, selectorValues } = setup({
                speakers: UBUNTU_SPEAKERS,
                activeAudioOutputId: 'builtin-speaker',
                speakerState: deviceState({
                    systemDefault: device('builtin-speaker', 'Comet Lake PCH-LP cAVS Speaker'),
                    useSystemDefault: true,
                }),
            });

            expect(switchActiveDevice).not.toHaveBeenCalled();

            selectorValues.set(
                selectSpeakerState,
                deviceState({
                    systemDefault: device('jabra', 'Jabra Evolve2 30 Analog Stereo'),
                    useSystemDefault: true,
                })
            );

            act(() => {
                rerender();
            });

            act(() => {
                vi.advanceTimersByTime(DEBOUNCE_MS);
            });

            expect(switchActiveDevice).toHaveBeenCalledWith(
                expect.objectContaining({ deviceType: 'audiooutput', deviceId: 'jabra' })
            );
        });

        it('picks the system default on initialization, when there is no active device yet', () => {
            const { switchActiveDevice } = setup({
                speakers: UBUNTU_SPEAKERS,
                activeAudioOutputId: '',
                speakerState: deviceState({
                    systemDefault: device('builtin-speaker', 'Comet Lake PCH-LP cAVS Speaker'),
                    useSystemDefault: true,
                }),
            });

            expect(switchActiveDevice).toHaveBeenCalledWith(
                expect.objectContaining({ deviceType: 'audiooutput', deviceId: 'builtin-speaker' })
            );
        });

        it('picks the preferred speaker on initialization, when there is no active device yet', () => {
            const { switchActiveDevice } = setup({
                speakers: UBUNTU_SPEAKERS,
                activeAudioOutputId: '',
                speakerState: deviceState({
                    systemDefault: device('builtin-speaker', 'Comet Lake PCH-LP cAVS Speaker'),
                    preferredDeviceId: 'jabra',
                }),
            });

            expect(switchActiveDevice).toHaveBeenCalledWith(
                expect.objectContaining({ deviceType: 'audiooutput', deviceId: 'jabra' })
            );
        });

        it('does not switch when the browser cannot set the sink', () => {
            browserMocks.supportsSetSinkId.mockReturnValueOnce(false);

            const { switchActiveDevice } = setup({
                speakers: UBUNTU_SPEAKERS,
                activeAudioOutputId: 'unplugged-dock',
                speakerState: deviceState({
                    systemDefault: device('builtin-speaker', 'Comet Lake PCH-LP cAVS Speaker'),
                }),
            });

            expect(switchActiveDevice).not.toHaveBeenCalled();
        });
    });

    describe('audio input', () => {
        it('does not switch when there is no resolvable system default', () => {
            const { switchActiveDevice, toggleAudio } = setup({
                microphones: [DEFAULT_ENTRY, device('builtin-mic', 'Built-in Microphone')],
                activeMicrophoneId: '',
                microphoneState: deviceState({ systemDefault: null, useSystemDefault: true }),
            });

            expect(switchActiveDevice).not.toHaveBeenCalled();
            expect(toggleAudio).not.toHaveBeenCalled();
        });

        it('picks the system default on initialization, when there is no active device yet', () => {
            const { switchActiveDevice, toggleAudio } = setup({
                microphones: [device('builtin-mic', 'Built-in Microphone'), device('usb-mic', 'USB Microphone')],
                activeMicrophoneId: '',
                microphoneState: deviceState({
                    systemDefault: device('builtin-mic', 'Built-in Microphone'),
                    useSystemDefault: true,
                }),
                isConnected: false,
            });

            expect(switchActiveDevice).toHaveBeenCalledWith(
                expect.objectContaining({ deviceType: 'audioinput', deviceId: 'builtin-mic' })
            );
            expect(toggleAudio).not.toHaveBeenCalled();
        });

        it('recreates the track through toggleAudio when connected', () => {
            const { toggleAudio, switchActiveDevice } = setup({
                microphones: [device('builtin-mic', 'Built-in Microphone'), device('usb-mic', 'USB Microphone')],
                activeMicrophoneId: 'unplugged-mic',
                microphoneState: deviceState({ systemDefault: device('builtin-mic', 'Built-in Microphone') }),
                isConnected: true,
            });

            expect(toggleAudio).toHaveBeenCalledWith(
                expect.objectContaining({ audioDeviceId: 'builtin-mic', preserveCache: true })
            );
            expect(switchActiveDevice).not.toHaveBeenCalled();
        });

        it('switches the active device directly when not connected', () => {
            const { toggleAudio, switchActiveDevice } = setup({
                microphones: [device('builtin-mic', 'Built-in Microphone'), device('usb-mic', 'USB Microphone')],
                activeMicrophoneId: 'unplugged-mic',
                microphoneState: deviceState({ systemDefault: device('builtin-mic', 'Built-in Microphone') }),
                isConnected: false,
            });

            expect(switchActiveDevice).toHaveBeenCalledWith(
                expect.objectContaining({ deviceType: 'audioinput', deviceId: 'builtin-mic' })
            );
            expect(toggleAudio).not.toHaveBeenCalled();
        });
    });

    describe('video input', () => {
        it('falls back to the first camera because there is no system default for video', () => {
            const { toggleVideo } = setup({
                cameras: [device('builtin-cam', 'Built-in Camera'), device('usb-cam', 'USB Camera')],
                activeCameraId: 'unplugged-cam',
                isConnected: true,
            });

            expect(toggleVideo).toHaveBeenCalledWith(
                expect.objectContaining({ videoDeviceId: 'builtin-cam', preserveCache: true })
            );
        });

        it('picks the first camera on initialization, when there is no active device yet', () => {
            const { switchActiveDevice, toggleVideo } = setup({
                cameras: [device('facetime', 'FaceTime HD Camera'), device('usb-cam', 'USB Camera')],
                activeCameraId: '',
                isConnected: false,
            });

            expect(switchActiveDevice).toHaveBeenCalledWith(
                expect.objectContaining({ deviceType: 'videoinput', deviceId: 'facetime' })
            );
            expect(toggleVideo).not.toHaveBeenCalled();
        });

        it('switches to the preferred camera when it is available', () => {
            const { toggleVideo } = setup({
                cameras: [device('builtin-cam', 'Built-in Camera'), device('usb-cam', 'USB Camera')],
                activeCameraId: 'builtin-cam',
                preferredCameraId: 'usb-cam',
                isConnected: true,
            });

            expect(toggleVideo).toHaveBeenCalledWith(expect.objectContaining({ videoDeviceId: 'usb-cam' }));
        });
    });

    describe('debounce', () => {
        it('does not act before the debounce window elapses', () => {
            const switchActiveDevice = vi.fn().mockResolvedValue(undefined);

            storeMocks.useMeetSelector.mockImplementation((selector: unknown) => {
                const values = new Map<unknown, unknown>([
                    [selectFilteredMicrophones, []],
                    [selectFilteredCameras, []],
                    [selectFilteredSpeakers, filterDevices(UBUNTU_SPEAKERS)],
                    [selectActiveMicrophoneId, null],
                    [selectActiveCameraId, null],
                    [selectActiveAudioOutputId, 'unplugged-dock'],
                    [selectPreferredCameraId, null],
                    [selectMicrophoneState, deviceState()],
                    [
                        selectSpeakerState,
                        deviceState({ systemDefault: device('builtin-speaker', 'Comet Lake PCH-LP cAVS Speaker') }),
                    ],
                ]);
                return values.get(selector);
            });

            livekitReact.useRoomContext.mockReturnValue({
                state: 'connected',
                localParticipant: { getTrackPublication: () => undefined, unpublishTrack: vi.fn() },
                on: vi.fn(),
                off: vi.fn(),
            });

            renderHook(() =>
                useDynamicDeviceHandling({
                    switchActiveDevice,
                    toggleAudio: vi.fn(),
                    toggleVideo: vi.fn(),
                })
            );

            act(() => {
                vi.advanceTimersByTime(DEBOUNCE_MS - 1);
            });
            expect(switchActiveDevice).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(1);
            });
            expect(switchActiveDevice).toHaveBeenCalledTimes(1);
        });
    });

    describe('empty lists', () => {
        it('does nothing while the device lists are still empty', () => {
            const { switchActiveDevice, toggleAudio, toggleVideo } = setup({
                activeAudioOutputId: 'gone',
                activeMicrophoneId: 'gone',
                activeCameraId: 'gone',
            });

            expect(switchActiveDevice).not.toHaveBeenCalled();
            expect(toggleAudio).not.toHaveBeenCalled();
            expect(toggleVideo).not.toHaveBeenCalled();
        });
    });
});
