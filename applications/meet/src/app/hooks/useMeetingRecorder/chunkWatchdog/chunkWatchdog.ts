import { logger } from '@proton/logger';

import type { ChunkWatchdog, ChunkWatchdogOptions, RecordingStallCause } from './types';

const DEFAULT_INTERVAL_MS = 2_000;
const DEFAULT_PRIMING_THRESHOLD_MS = 15_000;
export const DEFAULT_STALL_THRESHOLD_MS = 10_000;

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
    getStallCause,
    getReportContext,
    intervalMs = DEFAULT_INTERVAL_MS,
    primingThresholdMs = DEFAULT_PRIMING_THRESHOLD_MS,
    stallThresholdMs = DEFAULT_STALL_THRESHOLD_MS,
    isWebCodecs,
}: ChunkWatchdogOptions): ChunkWatchdog => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let startedAt = 0;
    let warned = false;

    let currentStall: { startedAt: number; cause: RecordingStallCause } | null = null;
    let stallCount = 0;
    let stallTotalMs = 0;
    let stallLongestMs = 0;
    let longestStallCause: RecordingStallCause | null = null;

    const recordStallDuration = (durationMs: number, cause: RecordingStallCause) => {
        stallTotalMs += durationMs;
        if (durationMs > stallLongestMs) {
            stallLongestMs = durationMs;
            longestStallCause = cause;
        }
    };

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
            const stallCause = getStallCause();
            const reportContext = getReportContext();

            currentStall = { startedAt: hasFirstChunk ? snapshot.lastChunkAt : startedAt, cause: stallCause };
            stallCount += 1;

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
                        stallCause,
                        ...reportContext,
                    },
                }
            );
        }

        if (sinceLastChunk <= threshold && warned) {
            warned = false;
            if (currentStall) {
                recordStallDuration(snapshot.lastChunkAt - currentStall.startedAt, currentStall.cause);
                currentStall = null;
            }
            logger.info('[MeetingRecorder] watchdog: chunks resumed');
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
        getStallSummary: () => {
            const openStallMs = currentStall ? performance.now() - currentStall.startedAt : 0;
            const isOpenStallLongest = currentStall !== null && openStallMs > stallLongestMs;

            return {
                stallCount,
                stallTotalMs: Math.round(stallTotalMs + openStallMs),
                stallLongestMs: Math.round(Math.max(stallLongestMs, openStallMs)),
                longestStallCause: isOpenStallLongest && currentStall ? currentStall.cause : longestStallCause,
            };
        },
    };
};
