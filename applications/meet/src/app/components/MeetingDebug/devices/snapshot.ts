import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';

export interface Snapshot {
    enumerated: SerializableDeviceInfo[];
    enumeratedAgo: string;
    livekitActive: Partial<Record<MediaDeviceKind, string | undefined>>;
    livekitAudioOutputOption: string | undefined;
    canPlaybackAudio: boolean;
    webAudioMixEnabled: boolean;
    microphoneTrackDeviceId: string | undefined;
    microphoneProcessing: string;
    microphoneTrackState: string;
    cameraTrackDeviceId: string | undefined;
    audioContextState: string;
    audioContextSampleRate: string;
    audioContextSinkId: string;
    cameraPermissions: string;
    microphonePermissions: string;
}

export const EMPTY_SNAPSHOT: Snapshot = {
    enumerated: [],
    enumeratedAgo: '(pending)',
    livekitActive: {},
    livekitAudioOutputOption: undefined,
    canPlaybackAudio: false,
    webAudioMixEnabled: false,
    microphoneTrackDeviceId: undefined,
    microphoneProcessing: '(none)',
    microphoneTrackState: '(no track)',
    cameraTrackDeviceId: undefined,
    audioContextState: '(none)',
    audioContextSampleRate: '(none)',
    audioContextSinkId: '(none)',
    cameraPermissions: '(unknown)',
    microphonePermissions: '(unknown)',
};
