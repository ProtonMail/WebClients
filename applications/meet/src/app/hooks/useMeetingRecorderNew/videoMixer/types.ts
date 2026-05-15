import type { Participant, Track } from 'livekit-client';

export enum VideoMixerMessageType {
    INIT = 'init',
    RENDER = 'render',
    UPDATE_STATE = 'updateState',
    UPDATE_FRAME = 'updateFrame',
    STOP = 'stop',
    START_TRACK_CAPTURE = 'startTrackCapture',
    STOP_TRACK_CAPTURE = 'stopTrackCapture',
}

export interface RecordingTrackInfo {
    track: Track | null;
    participant: Participant;
    isScreenShare: boolean;
    participantIndex: number;
}

export type ParticipantInfo = {
    identity: string;
    name: string;
    participantIndex: number;
    isScreenShare: boolean;
    hasVideo: boolean;
    hasActiveAudio: boolean;
};

export type GridLayout = { cols: number; rows: number };

export type SceneState = {
    participants: ParticipantInfo[];
    isLargerThanMd: boolean;
    isNarrowHeight: boolean;
    gridLayout: GridLayout;
};

export type SingleFrameData = {
    participantIdentity: string;
    frame: VideoFrame | ImageBitmap;
};

export type TrackCaptureData = {
    participantIdentity: string;
    track: MediaStreamTrack;
    trackId: string;
};

export type VideoMixerWorkerMessage =
    | { type: VideoMixerMessageType.INIT; canvas: OffscreenCanvas; state: SceneState }
    | { type: VideoMixerMessageType.RENDER }
    | { type: VideoMixerMessageType.UPDATE_STATE; state: SceneState }
    | { type: VideoMixerMessageType.UPDATE_FRAME; frameData: SingleFrameData }
    | { type: VideoMixerMessageType.STOP }
    | { type: VideoMixerMessageType.START_TRACK_CAPTURE; trackData: TrackCaptureData }
    | { type: VideoMixerMessageType.STOP_TRACK_CAPTURE; trackId: string };
