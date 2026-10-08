import type { TrackReference } from '@livekit/components-react';
import type { PublicKeyReference } from '@protontech/crypto';

import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';

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

export interface RecordingSessionStartOptions {
    initialScene: SceneState;
    initialAudioTracks: TrackReference[];
    initialRecordedTracks: RecordingTrackInfo[];
    encryptionKey?: PublicKeyReference;
}
