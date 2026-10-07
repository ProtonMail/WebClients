import { act, renderHook } from '@testing-library/react';
import { Track } from 'livekit-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    selectActiveMicrophoneId,
    selectInitialAudioState,
    selectMicrophoneState,
    selectMicrophones,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';

import { useAudioToggle } from './useAudioToggle';

const livekitReact = vi.hoisted(() => ({
    useLocalParticipant: vi.fn(),
    useRoomContext: vi.fn(),
}));
vi.mock('@livekit/components-react', () => livekitReact);

const errorReporting = vi.hoisted(() => ({ reportMeetError: vi.fn() }));
vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => errorReporting,
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));

const storeMocks = vi.hoisted(() => ({
    useMeetSelector: vi.fn((_selector: unknown): unknown => undefined),
    useMeetStore: () => ({ getState: () => ({}) }),
}));
vi.mock('@proton/meet/store/hooks', () => storeMocks);

const noiseCancellationModel = vi.hoisted(() => ({ id: 'krisp', isNative: false, createProcessor: () => null }));
vi.mock('../../../processors/noise-cancellation/useNoiseCancellationModel', () => ({
    useNoiseCancellationModel: () => noiseCancellationModel,
}));

vi.mock('../../../processors/noise-cancellation/useIsNoiseCancellationDisabledByDefault', () => ({
    useIsNoiseCancellationDisabledByDefault: () => false,
}));

const BUILT_IN_MICROPHONE = {
    deviceId: 'built-in',
    groupId: 'built-in-group',
    kind: 'audioinput',
    label: 'MacBook Pro Microphone',
};
const HEADSET_MICROPHONE_ID = 'headset';

const NOISE_FILTER_PROCESSOR = { name: 'livekit-noise-filter' };

const createOverconstrainedError = () => new DOMException('', 'OverconstrainedError');

const createMicrophoneTrack = ({
    captureTrackState,
    sentTrackState,
    processor,
    unmute = () => Promise.resolve(),
}: {
    captureTrackState: MediaStreamTrackState;
    sentTrackState: MediaStreamTrackState;
    processor?: typeof NOISE_FILTER_PROCESSOR;
    unmute?: () => Promise<void>;
}) => {
    const captureTrack = { readyState: captureTrackState };

    return {
        mediaStream: { getAudioTracks: () => [captureTrack] },
        mediaStreamTrack: {
            readyState: sentTrackState,
            getSettings: () => ({ echoCancellation: true }),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        },
        getProcessor: () => processor,
        unmute: vi.fn(unmute),
        mute: vi.fn().mockResolvedValue(undefined),
    };
};

type MicrophoneTrack = ReturnType<typeof createMicrophoneTrack>;

const setup = ({ track, activeMicrophoneId }: { track: MicrophoneTrack; activeMicrophoneId: string }) => {
    storeMocks.useMeetSelector.mockImplementation((selector: unknown) => {
        switch (selector) {
            case selectActiveMicrophoneId:
                return activeMicrophoneId;
            case selectInitialAudioState:
                return false;
            case selectMicrophones:
                return [BUILT_IN_MICROPHONE];
            case selectMicrophoneState:
                return { systemDefault: BUILT_IN_MICROPHONE };
            default:
                return undefined;
        }
    });

    Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
            enumerateDevices: () => Promise.resolve([BUILT_IN_MICROPHONE]),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        },
    });

    const publications = new Map([
        ['microphone', { kind: Track.Kind.Audio, source: Track.Source.Microphone, isMuted: true, audioTrack: track }],
    ]);

    const unmuteExistingOrPublishNew = async (enabled: boolean) => {
        const publication = publications.get('microphone');

        if (publication) {
            if (enabled) {
                await publication.audioTrack.unmute();
            }
            return;
        }

        if (enabled) {
            publications.set('microphone', {
                kind: Track.Kind.Audio,
                source: Track.Source.Microphone,
                isMuted: false,
                audioTrack: createMicrophoneTrack({ captureTrackState: 'live', sentTrackState: 'live' }),
            });
        }
    };

    const localParticipant = {
        audioTrackPublications: publications,
        setMicrophoneEnabled: vi.fn(unmuteExistingOrPublishNew),
        unpublishTrack: vi.fn(async () => {
            publications.delete('microphone');
        }),
    };

    livekitReact.useRoomContext.mockReturnValue({ localParticipant });
    livekitReact.useLocalParticipant.mockReturnValue({ isMicrophoneEnabled: false, localParticipant });

    const switchActiveDevice = vi.fn().mockResolvedValue(undefined);
    const meetAudioContext = { audioContext: {} as AudioContext, setSinkId: vi.fn(), cleanup: vi.fn() };

    const { result } = renderHook(() => useAudioToggle(switchActiveDevice, meetAudioContext));

    return { result, localParticipant };
};

describe('useAudioToggle — microphone unplugged while muted', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('recreates the microphone on the remaining device when the capture track ended behind a noise filter', async () => {
        const deadTrack = createMicrophoneTrack({
            captureTrackState: 'ended',
            sentTrackState: 'live',
            processor: NOISE_FILTER_PROCESSOR,
            unmute: () => Promise.reject(createOverconstrainedError()),
        });
        const { result, localParticipant } = setup({ track: deadTrack, activeMicrophoneId: HEADSET_MICROPHONE_ID });

        let toggleResult: boolean | undefined;
        await act(async () => {
            toggleResult = await result.current.toggleAudio({
                isEnabled: true,
                audioDeviceId: HEADSET_MICROPHONE_ID,
                preserveCache: true,
            });
        });

        expect(toggleResult).toBe(true);
        expect(localParticipant.unpublishTrack).toHaveBeenCalledWith(deadTrack, true);
        expect(localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(
            true,
            expect.objectContaining({ deviceId: { exact: BUILT_IN_MICROPHONE.deviceId } }),
            expect.anything()
        );
        expect(deadTrack.unmute).not.toHaveBeenCalled();
    });

    it('keeps the published track when the capture track is still live', async () => {
        const liveTrack = createMicrophoneTrack({
            captureTrackState: 'live',
            sentTrackState: 'live',
            processor: NOISE_FILTER_PROCESSOR,
        });
        const { result, localParticipant } = setup({
            track: liveTrack,
            activeMicrophoneId: BUILT_IN_MICROPHONE.deviceId,
        });

        let toggleResult: boolean | undefined;
        await act(async () => {
            toggleResult = await result.current.toggleAudio({
                isEnabled: true,
                audioDeviceId: BUILT_IN_MICROPHONE.deviceId,
                preserveCache: true,
            });
        });

        expect(toggleResult).toBe(true);
        expect(liveTrack.unmute).toHaveBeenCalled();
        expect(localParticipant.unpublishTrack).not.toHaveBeenCalled();
    });

    it('reports the failed step and the track state when switching to a device that is gone', async () => {
        const trackWithStaleDevice = createMicrophoneTrack({
            captureTrackState: 'live',
            sentTrackState: 'live',
            unmute: () => Promise.reject(createOverconstrainedError()),
        });
        const { result } = setup({ track: trackWithStaleDevice, activeMicrophoneId: HEADSET_MICROPHONE_ID });

        let toggleResult: boolean | undefined;
        await act(async () => {
            toggleResult = await result.current.toggleAudio({
                isEnabled: false,
                audioDeviceId: BUILT_IN_MICROPHONE.deviceId,
                preserveCache: true,
            });
        });

        expect(toggleResult).toBe(false);
        expect(errorReporting.reportMeetError).toHaveBeenCalledWith('Failed to toggle audio', {
            context: { error: expect.objectContaining({ name: 'OverconstrainedError' }) },
            tags: {
                isEnabled: false,
                failedStep: 'recreate-enable-microphone-relaxed',
                isTrackEnded: false,
                hasTrackProcessor: false,
            },
        });
    });
});
