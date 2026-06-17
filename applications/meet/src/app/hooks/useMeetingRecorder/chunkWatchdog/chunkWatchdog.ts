import type { ChunkWatchdog, ChunkWatchdogOptions } from './types';

const DEFAULT_INTERVAL_MS = 2_000;
const DEFAULT_PRIMING_THRESHOLD_MS = 15_000;
const DEFAULT_STALL_THRESHOLD_MS = 10_000;

// Surfaces stalled MediaRecorder encoders to the console and Sentry.
//
// Two phases:
//   - priming: no first chunk yet, generous threshold
//   - stall:   had data, then went silent, tighter threshold
//
// Both are intentionally lenient: slow CPUs with MP4 can legitimately produce
// chunks several seconds apart.
export const createChunkWatchdog = ({
    stats,
    reportMeetError,
    getRecorderState,
    getCodec,
    intervalMs = DEFAULT_INTERVAL_MS,
    primingThresholdMs = DEFAULT_PRIMING_THRESHOLD_MS,
    stallThresholdMs = DEFAULT_STALL_THRESHOLD_MS,
    isWebCodecs,
}: ChunkWatchdogOptions): ChunkWatchdog => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let startedAt = 0;
    let warned = false;

    const tick = () => {
        const snapshot = stats.snapshot();
        const now = performance.now();
        const hasFirstChunk = snapshot.firstChunkAt !== null;
        const sinceLastChunk = hasFirstChunk ? now - snapshot.lastChunkAt : now - startedAt;
        const threshold = hasFirstChunk ? stallThresholdMs : primingThresholdMs;

        if (sinceLastChunk > threshold && !warned) {
            warned = true;
            const phase = hasFirstChunk ? 'stall' : 'no-first-chunk';
            const recordingCodec = getCodec();
            const mediaRecorderState = getRecorderState();

            // eslint-disable-next-line no-console
            console.error(
                `[MeetingRecorder] watchdog: no chunk with data in the last ${Math.round(sinceLastChunk)}ms (${phase})`,
                {
                    isWebCodecs,
                    recordingCodec,
                    mediaRecorderState,
                    chunksWithData: snapshot.chunkCount,
                    emptyChunks: snapshot.emptyChunkCount,
                    firstChunkAt: snapshot.firstChunkAt,
                }
            );
            reportMeetError(
                isWebCodecs
                    ? 'MeetingRecording Error WebCodecs: watchdog detected stalled MediaRecorder'
                    : 'MeetingRecording Error: watchdog detected stalled MediaRecorder',
                {
                    context: {
                        isWebCodecs,
                        recordingCodec,
                        mediaRecorderState,
                        chunksWithData: snapshot.chunkCount,
                        emptyChunks: snapshot.emptyChunkCount,
                        sinceLastChunkMs: Math.round(sinceLastChunk),
                        phase,
                    },
                }
            );
        }

        if (sinceLastChunk <= threshold && warned) {
            warned = false;
            // eslint-disable-next-line no-console
            console.log('[MeetingRecorder] watchdog: chunks resumed');
        }
    };

    return {
        start: () => {
            if (interval !== null) {
                return;
            }
            startedAt = performance.now();
            warned = false;
            interval = setInterval(tick, intervalMs);
        },
        stop: () => {
            if (interval !== null) {
                clearInterval(interval);
                interval = null;
            }
        },
    };
};
