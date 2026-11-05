import { act, renderHook } from '@testing-library/react';
import { type Room, Track } from 'livekit-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIsAudioPlaybackBlocked } from './useIsAudioPlaybackBlocked';

const livekitMocks = vi.hoisted(() => ({
    useRoomContext: vi.fn(),
    useStartAudio: vi.fn(),
    useTracks: vi.fn(),
}));
vi.mock('@livekit/components-react', () => livekitMocks);

type FakeState = 'suspended' | 'running';

const createFakeAudioContext = (initialState: FakeState) => {
    const listeners = new Set<() => void>();

    const fake = {
        state: initialState as FakeState,
        addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
        goTo: (state: FakeState) => {
            fake.state = state;
            listeners.forEach((listener) => listener());
        },
    };

    return fake;
};

const remoteMicrophone = {
    participant: { isLocal: false },
    publication: { kind: Track.Kind.Audio },
    source: Track.Source.Microphone,
};

const localMicrophone = { ...remoteMicrophone, participant: { isLocal: true } };

const setup = ({
    audioContextState = 'suspended' as FakeState,
    isAudioMixingEnabled = true,
    canPlayAudio = true,
    trackRefs = [remoteMicrophone] as unknown[],
} = {}) => {
    const audioContext = createFakeAudioContext(audioContextState);
    const room = {
        options: { webAudioMix: isAudioMixingEnabled ? { audioContext } : false },
    } as unknown as Room;

    livekitMocks.useRoomContext.mockReturnValue(room);
    livekitMocks.useStartAudio.mockReturnValue({ canPlayAudio, mergedProps: {} });
    livekitMocks.useTracks.mockReturnValue(trackRefs);

    const { result } = renderHook(() => useIsAudioPlaybackBlocked());

    return { audioContext, result };
};

describe('useIsAudioPlaybackBlocked', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('only counts subscribed remote audio tracks', () => {
        const remoteVideo = { ...remoteMicrophone, publication: { kind: Track.Kind.Video } };
        const { result } = setup({ audioContextState: 'suspended', trackRefs: [remoteVideo] });

        expect(result.current).toBe(false);
        expect(livekitMocks.useTracks).toHaveBeenCalledWith(
            [Track.Source.Microphone, Track.Source.ScreenShareAudio],
            expect.objectContaining({ onlySubscribed: true })
        );
    });

    // LiveKit reports playback as started once the muted elements play, even with the context suspended
    it('ignores LiveKit reporting playback when the mixing context is suspended', () => {
        const { result } = setup({ audioContextState: 'suspended', canPlayAudio: true });

        expect(result.current).toBe(true);
    });

    // LiveKit gives up after 200ms of resuming, while a slow output device can start right after
    it('ignores LiveKit reporting blocked playback when the mixing context runs', () => {
        const { result } = setup({ audioContextState: 'running', canPlayAudio: false });

        expect(result.current).toBe(false);
    });

    it('unblocks once the context starts running', () => {
        const { audioContext, result } = setup({ audioContextState: 'suspended' });

        act(() => {
            audioContext.goTo('running');
        });

        expect(result.current).toBe(false);
    });

    it('is not blocked when nobody else is sending audio', () => {
        const { result } = setup({ audioContextState: 'suspended', trackRefs: [] });

        expect(result.current).toBe(false);
    });

    it('is not blocked by the local microphone alone', () => {
        const { result } = setup({ audioContextState: 'suspended', trackRefs: [localMicrophone] });

        expect(result.current).toBe(false);
    });

    it('follows LiveKit when audio is not mixed through the context', () => {
        expect(setup({ isAudioMixingEnabled: false, canPlayAudio: false }).result.current).toBe(true);
        expect(setup({ isAudioMixingEnabled: false, canPlayAudio: true }).result.current).toBe(false);
    });
});
