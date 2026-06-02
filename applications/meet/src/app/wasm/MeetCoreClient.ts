import type { App, ConnectionStateInfo, JoinTypeInfo, RejoinReasonInfo } from '@proton-meet/proton-meet-core';

export interface GroupKeyInfoData {
    key: string;
    epoch: bigint;
}

export interface GroupDisplayCodeData {
    full_code: string;
}

export interface DecryptedMessageInfoData {
    message: string;
    sender_participant_id: string;
}

export interface ParticipantTrackSettingsInfoData {
    audio: number;
    video: number;
}

export interface MeetCoreClient {
    ping(): Promise<bigint>;
    joinMeetingWithAccessToken(...args: Parameters<App['joinMeetingWithAccessToken']>): Promise<void>;
    joinMeetingWithAccessTokenWithSwitchJoinType(
        ...args: Parameters<App['joinMeetingWithAccessTokenWithSwitchJoinType']>
    ): Promise<void>;
    joinRoomWithProposal(...args: Parameters<App['joinRoomWithProposal']>): Promise<void>;
    leaveMeeting(): Promise<void>;
    triggerWebSocketReconnect(): Promise<void>;
    getJoinType(...args: Parameters<App['getJoinType']>): Promise<JoinTypeInfo>;
    getGroupKey(): Promise<GroupKeyInfoData>;
    getGroupDisplayCode(): Promise<GroupDisplayCodeData>;
    isMlsUpToDate(): Promise<boolean>;
    isWebsocketHasReconnected(): Promise<boolean>;
    getWsState(): Promise<ConnectionStateInfo>;
    setMlsGroupUpdateHandler(): Promise<void>;
    setMlsSyncStateUpdateHandler(): Promise<void>;
    setLiveKitAdminChangeHandler(): Promise<void>;
    setDisconnectionHandler(): Promise<void>;
    setLivekitActiveUuids(...args: Parameters<App['setLivekitActiveUuids']>): Promise<void>;
    setWebsocketPingInterval(...args: Parameters<App['setWebsocketPingInterval']>): Promise<void>;
    setWebsocketPongTimeout(...args: Parameters<App['setWebsocketPongTimeout']>): Promise<void>;
    setWebsocketMaxPingFailures(...args: Parameters<App['setWebsocketMaxPingFailures']>): Promise<void>;
    encryptMessage(...args: Parameters<App['encryptMessage']>): Promise<Uint8Array<ArrayBuffer>>;
    decryptMessage(...args: Parameters<App['decryptMessage']>): Promise<DecryptedMessageInfoData>;
    logStartToJoinRoom(): Promise<void>;
    logJoinedRoom(...args: Parameters<App['logJoinedRoom']>): Promise<void>;
    logJoinedRoomFailed(...args: Parameters<App['logJoinedRoomFailed']>): Promise<void>;
    logConnectionLost(): Promise<void>;
    logUserEpochHealth(...args: Parameters<App['logUserEpochHealth']>): Promise<void>;
    logUserRejoin(...args: Parameters<App['logUserRejoin']>): Promise<void>;
    tryLogDesignatedCommitter(...args: Parameters<App['tryLogDesignatedCommitter']>): Promise<void>;
    removeParticipant(...args: Parameters<App['removeParticipant']>): Promise<void>;
    updateParticipantTrackSettings(
        ...args: Parameters<App['updateParticipantTrackSettings']>
    ): Promise<ParticipantTrackSettingsInfoData>;
    endMeeting(): Promise<void>;
    dispose(): void;
}

export type MeetCoreRejoinReason = RejoinReasonInfo;
