import type { Participant, Track } from 'livekit-client';

export interface RecordingTrackInfo {
    track: Track | null;
    participant: Participant;
    isScreenShare: boolean;
    participantIndex: number;
}

export interface FrameReaderInfo {
    reader: ReadableStreamDefaultReader<VideoFrame> | null;
    participantKey: string;
}

export type RecordingCodec = {
    mimeType: string;
    extension: string;
};

export type CodecProbeOutcome = 'unsupported' | 'data' | 'flush' | 'timeout' | 'error' | 'throw';
