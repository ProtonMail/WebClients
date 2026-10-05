import { KrispNoiseFilter, isKrispNoiseFilterSupported } from '@livekit/krisp-noise-filter';
import type { AudioProcessorOptions, Room } from 'livekit-client';

import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';

import { getDevicePerformanceContext } from '../getDevicePerformanceContext';
import type { CreateProcessorOptions, NoiseCancellationModel } from '../types';

const LIVEKIT_CLOUD_EDITION = 1;

export const KRISP_OVERFLOWS_BEFORE_GIVING_UP = 4;

const isBrowserSupported = isKrispNoiseFilterSupported();

const isRoomInLivekitCloud = (room: Room) => room.serverInfo?.edition === LIVEKIT_CLOUD_EDITION;

const reportKrispOverflow = async ({
    reportError,
    overflowCount,
    startedAt,
    audioContext,
}: {
    reportError: ReportMeetError;
    overflowCount: number;
    startedAt: number;
    audioContext?: AudioContext;
}) => {
    const hasGivenUp = overflowCount >= KRISP_OVERFLOWS_BEFORE_GIVING_UP;
    const context = {
        overflowCount,
        secondsSinceStart: Math.round((performance.now() - startedAt) / 1000),
        ...(await getDevicePerformanceContext(audioContext)),
    };

    // Separate labels, so the per-label report cap spent on recoverable overflows can't hide the final one.
    reportError(
        hasGivenUp
            ? 'Krisp noise filter disabled after repeated buffer overflows'
            : 'Krisp noise filter paused after buffer overflow',
        {
            level: 'warning',
            tags: { feature: 'noise-cancellation', noiseCancellationModel: 'krisp' },
            context,
        }
    );
};

/** Only licensed for LiveKit Cloud rooms, so it stays gated on the server edition. */
export const createKrispModel = (
    room: Room,
    { debugLogs, reportError }: { debugLogs: boolean; reportError: ReportMeetError }
): NoiseCancellationModel => ({
    id: 'krisp',
    isSupported: () => isBrowserSupported && isRoomInLivekitCloud(room),
    isNative: false,
    createProcessor: ({ onDisabledForPerformance }: CreateProcessorOptions = {}) => {
        let overflowCount = 0;
        let startedAt = performance.now();
        let audioContext: AudioContext | undefined;

        const processor = KrispNoiseFilter({
            debugLogs,
            onBufferDrop: () => {
                overflowCount += 1;
                void reportKrispOverflow({ reportError, overflowCount, startedAt, audioContext });

                if (overflowCount === KRISP_OVERFLOWS_BEFORE_GIVING_UP) {
                    onDisabledForPerformance?.();
                }
            },
        });

        const init = processor.init.bind(processor);
        const restart = processor.restart.bind(processor);
        const onStart = (opts: AudioProcessorOptions) => {
            overflowCount = 0;
            startedAt = performance.now();
            audioContext = opts.audioContext ?? audioContext;
        };
        processor.init = async (opts) => {
            onStart(opts);
            return init(opts);
        };
        processor.restart = async (opts) => {
            onStart(opts);
            return restart(opts);
        };

        return processor;
    },
});
