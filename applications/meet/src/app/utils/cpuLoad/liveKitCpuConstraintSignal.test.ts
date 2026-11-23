import type { LocalParticipant, LocalVideoTrack } from 'livekit-client';
import { ParticipantEvent, Track } from 'livekit-client';
import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';

import { createLiveKitCpuConstraintSignal } from './liveKitCpuConstraintSignal';

type SenderStatsRead = 'cpu' | 'none' | 'throws';

const setup = () => {
    let senderStatsRead: SenderStatsRead = 'cpu';
    const track = {
        getSenderStats: async () => {
            if (senderStatsRead === 'throws') {
                throw new Error('getStats failed');
            }
            return [{ qualityLimitationReason: senderStatsRead }];
        },
    } as unknown as LocalVideoTrack;
    const cameraPublication = { videoTrack: track, source: Track.Source.Camera };
    const videoTrackPublications = new Map([['camera', cameraPublication]]);
    const localParticipant = Object.assign(new EventEmitter(), { videoTrackPublications });
    const signal = createLiveKitCpuConstraintSignal(localParticipant as unknown as LocalParticipant);

    const refreshReading = async (read: SenderStatsRead) => {
        senderStatsRead = read;
        await signal.refresh();
    };

    return {
        signal,
        markConstrained: () =>
            localParticipant.emit(ParticipantEvent.LocalTrackCpuConstrained, track, cameraPublication),
        refreshReading,
        unpublish: () => videoTrackPublications.clear(),
    };
};

type Harness = ReturnType<typeof setup>;

const events: Record<string, (harness: Harness) => unknown> = {
    LocalTrackCpuConstrained: ({ markConstrained }) => markConstrained(),
    'refresh reads cpu': ({ refreshReading }) => refreshReading('cpu'),
    'refresh reads none': ({ refreshReading }) => refreshReading('none'),
    'refresh read throws': ({ refreshReading }) => refreshReading('throws'),
    'track unpublished': ({ unpublish, refreshReading }) => {
        unpublish();
        return refreshReading('cpu');
    },
    stop: ({ signal }) => signal.stop(),
};

describe('createLiveKitCpuConstraintSignal', () => {
    it.each`
        state           | event                         | expected
        ${'not in set'} | ${'LocalTrackCpuConstrained'} | ${'in set'}
        ${'in set'}     | ${'LocalTrackCpuConstrained'} | ${'in set'}
        ${'not in set'} | ${'refresh reads cpu'}        | ${'in set'}
        ${'in set'}     | ${'refresh reads cpu'}        | ${'in set'}
        ${'not in set'} | ${'refresh reads none'}       | ${'not in set'}
        ${'in set'}     | ${'refresh reads none'}       | ${'not in set'}
        ${'not in set'} | ${'refresh read throws'}      | ${'not in set'}
        ${'in set'}     | ${'refresh read throws'}      | ${'in set'}
        ${'not in set'} | ${'track unpublished'}        | ${'not in set'}
        ${'in set'}     | ${'track unpublished'}        | ${'not in set'}
        ${'not in set'} | ${'stop'}                     | ${'not in set'}
        ${'in set'}     | ${'stop'}                     | ${'not in set'}
    `('$state, then $event: $expected', async ({ state, event, expected }) => {
        const harness = setup();
        if (state === 'in set') {
            harness.markConstrained();
        }

        await events[event](harness);

        expect(harness.signal.isCritical()).toBe(expected === 'in set');
    });

    it('follows the sender stats after LiveKit fired its only CPU constrained event', async () => {
        const { signal, markConstrained, refreshReading } = setup();
        markConstrained();
        const criticalPerSample: boolean[] = [];

        for (const read of ['cpu', 'cpu', 'none', 'cpu', 'cpu'] as const) {
            await refreshReading(read);
            criticalPerSample.push(signal.isCritical());
        }

        expect(criticalPerSample).toEqual([true, true, false, true, true]);
    });

    it('keeps a constrained track through failed reads until the stats clear it', async () => {
        const { signal, markConstrained, refreshReading } = setup();
        markConstrained();

        await refreshReading('throws');
        await refreshReading('throws');
        expect(signal.isCritical()).toBe(true);

        await refreshReading('none');
        expect(signal.isCritical()).toBe(false);
    });

    it('ignores a CPU constrained screen share', async () => {
        const screenShareTrack = {
            getSenderStats: async () => [{ qualityLimitationReason: 'cpu' }],
        } as unknown as LocalVideoTrack;
        const screenSharePublication = { videoTrack: screenShareTrack, source: Track.Source.ScreenShare };
        const localParticipant = Object.assign(new EventEmitter(), {
            videoTrackPublications: new Map([['screen', screenSharePublication]]),
        });
        const signal = createLiveKitCpuConstraintSignal(localParticipant as unknown as LocalParticipant);

        localParticipant.emit(ParticipantEvent.LocalTrackCpuConstrained, screenShareTrack, screenSharePublication);
        expect(signal.isCritical()).toBe(false);

        await signal.refresh();
        expect(signal.isCritical()).toBe(false);
    });

    it('stops listening on stop', () => {
        const { signal, markConstrained } = setup();
        signal.stop();

        markConstrained();

        expect(signal.isCritical()).toBe(false);
    });
});
