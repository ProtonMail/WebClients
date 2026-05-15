import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';

import type { RecordingCodec } from '../codec/types';

export interface MeetMediaRecorderOptions {
    audioTracks: MediaStreamTrack[];
    videoTracks: MediaStreamTrack[];
    primaryCodec: RecordingCodec;
    onChunk: (chunk: Blob) => void;
    onEmptyChunk: () => void;
    onRuntimeError: (error: Error | null) => void;
    reportMeetError: ReportMeetError;
}
