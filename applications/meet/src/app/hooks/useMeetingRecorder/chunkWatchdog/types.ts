import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';

import type { RecordingCodec } from '../codec/types';
import type { ChunkStats } from '../mediaRecorder/chunkStats';

/**
 * Probable reason no chunk has been written, sampled when the watchdog detects the stall.
 * - `audio-context`: the recorder AudioContext is not running (suspended, interrupted or closed),
 *   so no audio reaches the encoder.
 * - `audio-tap`: the AudioContext is running but the recorder worklet stopped posting samples.
 * - `encoder-or-muxer`: audio is flowing, so the stall is downstream: video capture, the encoders
 *   or the muxer waiting on a track.
 */
export type RecordingStallCause = 'audio-context' | 'audio-tap' | 'encoder-or-muxer';

export interface StallSummary {
    stallCount: number;
    stallTotalMs: number;
    stallLongestMs: number;
    longestStallCause: RecordingStallCause | null;
}

export interface ChunkWatchdogOptions {
    stats: ChunkStats;
    reportMeetError: ReportMeetError;
    getRecorderState: () => RecordingState;
    getCodec: () => RecordingCodec;
    getStallCause: () => RecordingStallCause;
    getReportContext: () => Record<string, unknown>;
    intervalMs?: number;
    primingThresholdMs?: number;
    stallThresholdMs?: number;
    isWebCodecs: boolean;
}

export interface ChunkWatchdog {
    start(): void;
    stop(): void;
    getStallSummary(): StallSummary;
}
