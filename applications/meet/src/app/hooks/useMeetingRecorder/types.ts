import type { RecordingCodec } from './codec/types';

// Runtime surface that RecordingSession drives, shared by both recording
// orchestrators: the legacy MediaRecorder-based MeetMediaRecorder and the WebCodecs
export interface RecorderAPI {
    start(): Promise<void>;
    stop(): Promise<void>;
    getActiveCodec(): RecordingCodec;
    getRecorderState(): RecordingState;
}
