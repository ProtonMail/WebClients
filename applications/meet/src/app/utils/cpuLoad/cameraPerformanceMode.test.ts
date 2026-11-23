import type { LocalVideoTrack, Room } from 'livekit-client';
import { ConnectionState, Track } from 'livekit-client';
import { describe, expect, it, vi } from 'vitest';

import { syncCameraPerformanceMode } from './cameraPerformanceMode';

const dummyMocks = vi.hoisted(() => ({ isDummyVideoTrack: vi.fn(() => false) }));
vi.mock('../dummyVideoTrack', () => dummyMocks);

const setup = ({
    state = ConnectionState.Connected,
    isMuted = false,
    hasSender = true,
    isDummy = false,
}: { state?: ConnectionState; isMuted?: boolean; hasSender?: boolean; isDummy?: boolean } = {}) => {
    dummyMocks.isDummyVideoTrack.mockReturnValue(isDummy);
    const track = {
        isMuted,
        sender: hasSender ? {} : undefined,
        prioritizePerformance: vi.fn().mockResolvedValue(undefined),
    };
    const room = {
        state,
        localParticipant: {
            trackPublications: new Map([['camera', { kind: Track.Kind.Video, source: Track.Source.Camera, track }]]),
        },
    } as unknown as Room;
    const prioritizedTracks = new WeakSet<LocalVideoTrack>();
    const republishCamera = vi.fn().mockResolvedValue(true);

    const sync = (isPrioritized: boolean) =>
        syncCameraPerformanceMode({ room, isPrioritized, prioritizedTracks, republishCamera });

    return { track, sync, republishCamera };
};

describe('syncCameraPerformanceMode', () => {
    it('prioritizes performance on the camera track once', async () => {
        const { track, sync, republishCamera } = setup();

        await sync(true);
        await sync(true);

        expect(track.prioritizePerformance).toHaveBeenCalledTimes(1);
        expect(republishCamera).not.toHaveBeenCalled();
    });

    it('republishes the camera to leave the mode', async () => {
        const { sync, republishCamera } = setup();

        await sync(true);
        await sync(false);

        expect(republishCamera).toHaveBeenCalledTimes(1);
    });

    it('keeps a camera track it never prioritized', async () => {
        const { sync, republishCamera } = setup();

        await sync(false);

        expect(republishCamera).not.toHaveBeenCalled();
    });

    it.each`
        case                 | options
        ${'muted'}           | ${{ isMuted: true }}
        ${'a placeholder'}   | ${{ isDummy: true }}
        ${'not sending yet'} | ${{ hasSender: false }}
        ${'reconnecting'}    | ${{ state: ConnectionState.Reconnecting }}
    `('leaves the camera alone while it is $case', async ({ options }) => {
        const { track, sync } = setup(options);

        await sync(true);

        expect(track.prioritizePerformance).not.toHaveBeenCalled();
    });

    it('waits for a muted prioritized camera to be unmuted before republishing it', async () => {
        const { track, sync, republishCamera } = setup();
        await sync(true);

        track.isMuted = true;
        await sync(false);
        expect(republishCamera).not.toHaveBeenCalled();

        track.isMuted = false;
        await sync(false);
        expect(republishCamera).toHaveBeenCalledTimes(1);
    });
});
