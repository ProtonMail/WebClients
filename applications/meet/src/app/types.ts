export interface ParticipantSettings {
    displayName: string;
    audioDeviceId: string;
    videoDeviceId: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isFaceTrackingEnabled: boolean;
    roomName: string;
}

export enum LoadingState {
    JoiningInProgress = 'JoiningInProgress',
    WaitingRoom = 'WaitingRoom',
}
