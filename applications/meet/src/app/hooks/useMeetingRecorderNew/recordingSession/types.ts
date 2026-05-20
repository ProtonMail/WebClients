import type { TrackReference } from '@livekit/components-react';

import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';

import type { RecordingCodec } from '../codec/types';
import type { RecordingTrackInfo, SceneState } from '../videoMixer/types';

export interface RecordingSessionDeps {
    codec: RecordingCodec;
    reportMeetError: ReportMeetError;
    onRuntimeError: () => void;
}

export interface RecordingSessionStartOptions {
    initialScene: SceneState;
    initialAudioTracks: TrackReference[];
    initialRecordedTracks: RecordingTrackInfo[];
}
