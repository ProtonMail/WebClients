import type { Participant, Track } from 'livekit-client';

export interface RecordingTrackInfo {
    track: Track | null;
    participant: Participant;
    isScreenShare: boolean;
    participantIndex: number;
}

export interface MeetingRecordingState {
    isRecording: boolean;
    recordedChunks: Blob[];
}

export interface FrameReaderInfo {
    reader: ReadableStreamDefaultReader<VideoFrame> | null;
    participantKey: string;
}
