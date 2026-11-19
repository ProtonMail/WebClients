import { renderHook } from '@testing-library/react';
import { type Room, Track } from 'livekit-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { selectAudioPlaybackStatus } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import type { AudioPlaybackStatus } from '@proton/meet/store/slices/deviceManagementSlice/types';

import { useIsAudioPlaybackBlocked } from './useIsAudioPlaybackBlocked';

const livekitMocks = vi.hoisted(() => ({
    useRoomContext: vi.fn(),
    useStartAudio: vi.fn(),
    useTracks: vi.fn(),
}));
vi.mock('@livekit/components-react', () => livekitMocks);

const storeMocks = vi.hoisted(() => ({ useMeetSelector: vi.fn() }));
vi.mock('@proton/meet/store/hooks', () => storeMocks);

const remoteMicrophone = {
    participant: { isLocal: false },
    publication: { kind: Track.Kind.Audio },
    source: Track.Source.Microphone,
};

const localMicrophone = { ...remoteMicrophone, participant: { isLocal: true } };

const setup = ({
    audioPlaybackStatus = 'blocked' as AudioPlaybackStatus,
    isAudioMixingEnabled = true,
    canPlayAudio = true,
    trackRefs = [remoteMicrophone] as unknown[],
} = {}) => {
    const room = {
        options: { webAudioMix: isAudioMixingEnabled ? { audioContext: {} } : false },
    } as unknown as Room;

    livekitMocks.useRoomContext.mockReturnValue(room);
    livekitMocks.useStartAudio.mockReturnValue({ canPlayAudio, mergedProps: {} });
    livekitMocks.useTracks.mockReturnValue(trackRefs);
    storeMocks.useMeetSelector.mockImplementation((selector: unknown) =>
        selector === selectAudioPlaybackStatus ? audioPlaybackStatus : undefined
    );

    const { result } = renderHook(() => useIsAudioPlaybackBlocked());

    return { result };
};

describe('useIsAudioPlaybackBlocked', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('only counts subscribed remote audio tracks', () => {
        const remoteVideo = { ...remoteMicrophone, publication: { kind: Track.Kind.Video } };
        const { result } = setup({ audioPlaybackStatus: 'blocked', trackRefs: [remoteVideo] });

        expect(result.current).toBe(false);
        expect(livekitMocks.useTracks).toHaveBeenCalledWith(
            [Track.Source.Microphone, Track.Source.ScreenShareAudio],
            expect.objectContaining({ onlySubscribed: true })
        );
    });

    it('is blocked when the playback is blocked, even if LiveKit reports playback', () => {
        const { result } = setup({ audioPlaybackStatus: 'blocked', canPlayAudio: true });

        expect(result.current).toBe(true);
    });

    it('is not blocked while the playback recovers on its own, such as during an output switch', () => {
        const { result } = setup({ audioPlaybackStatus: 'recovering' });

        expect(result.current).toBe(false);
    });

    it('is not blocked when the playback runs, even if LiveKit reports blocked playback', () => {
        const { result } = setup({ audioPlaybackStatus: 'running', canPlayAudio: false });

        expect(result.current).toBe(false);
    });

    it('is not blocked when nobody else is sending audio', () => {
        const { result } = setup({ audioPlaybackStatus: 'blocked', trackRefs: [] });

        expect(result.current).toBe(false);
    });

    it('is not blocked by the local microphone alone', () => {
        const { result } = setup({ audioPlaybackStatus: 'blocked', trackRefs: [localMicrophone] });

        expect(result.current).toBe(false);
    });

    it('follows LiveKit when audio is not mixed through the context', () => {
        expect(setup({ isAudioMixingEnabled: false, canPlayAudio: false }).result.current).toBe(true);
        expect(setup({ isAudioMixingEnabled: false, canPlayAudio: true }).result.current).toBe(false);
    });
});
