import type { TrackReference } from '@livekit/components-react';
import type { PublicKeyReference } from '@protontech/crypto';

import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import type { OpfsRecording } from '@proton/meet/store/slices/recordingsSlice';

import type { AudioMixerDiagnostics } from '../audioMixer/audioMixer';
import type { RecordingCodec } from '../codec/types';
import type { RecordingTrackInfo, SceneState } from '../videoMixer/types';

export interface RecordingSessionOptions {
    codec: RecordingCodec;
    isWebCodecs: boolean;
    userId: string;
    reportMeetError: ReportMeetError;
    onRuntimeError: () => void;
    // Called when OPFS quota is reached during recording
    onStorageFull: (hasWrittenData: boolean) => void;
    // Called when writing to OPFS fails for any other reason
    onWriteError: (hasWrittenData: boolean) => void;
}

export type RecordingOutcome = 'ready' | 'empty' | 'failed';

export interface RecordingStopReport {
    outcome: RecordingOutcome | null;
    error: string | null;
    durationMs: number | null;
    stopDurationMs: number | null;
    bytesBeforeStop: number;
    file: OpfsRecording | null;
}

export interface RecordingDiagnostics {
    isActive: boolean;
    endedAt: number | null;
    stopReport: RecordingStopReport | null;
    backend: 'webcodecs' | 'mediarecorder';
    mimeType: string;
    recorderState: RecordingState;
    audio: AudioMixerDiagnostics | null;
    chunkCount: number;
    totalBytes: number;
    emptyChunkCount: number;
    lastChunkAt: number | null;
    pendingWriteCount: number;
}

export interface RecordingSessionStartOptions {
    initialScene: SceneState;
    initialAudioTracks: TrackReference[];
    initialRecordedTracks: RecordingTrackInfo[];
    encryptionKey?: PublicKeyReference;
}
