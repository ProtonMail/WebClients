import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';

import type { RecordingCodec } from '../codec/types';
import type { ChunkStats } from '../mediaRecorder/chunkStats';

export interface ChunkWatchdogOptions {
    stats: ChunkStats;
    reportMeetError: ReportMeetError;
    getRecorderState: () => RecordingState;
    getCodec: () => RecordingCodec;
    intervalMs?: number;
    primingThresholdMs?: number;
    stallThresholdMs?: number;
    isWebCodecs: boolean;
}

export interface ChunkWatchdog {
    start(): void;
    stop(): void;
}
