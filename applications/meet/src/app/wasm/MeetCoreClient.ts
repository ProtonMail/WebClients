import type {
    App,
    ChatComposeResult,
    ChatEventKind,
    ChatIncomingEventInfo,
    ChatProtocolInfo,
    ConnectionStateInfo,
    JoinTypeInfo,
    RejoinReasonInfo,
} from '@proton-meet/proton-meet-core';

export interface GroupKeyInfoData {
    key: string;
    epoch: bigint;
}

export interface CreateJoinRequestResult {
    request_id: string;
}

export interface ChatIncomingEventInfoData {
    emoji?: string;
    id: string;
    in_reply_to_id?: string;
    kind: ChatEventKind;
    protocol: ChatProtocolInfo;
    received_at_ms: bigint;
    replaces_id?: string;
    sender_participant_id: string;
    target_id?: string;
    text?: string;
    topic_id?: string;
}

export interface ChatComposeResultData {
    local_echo: ChatIncomingEventInfoData;
    payload: Uint8Array<ArrayBuffer>;
}

export const toChatIncomingEventInfoData = (event: ChatIncomingEventInfo): ChatIncomingEventInfoData => ({
    emoji: event.emoji,
    id: event.id,
    in_reply_to_id: event.in_reply_to_id,
    kind: event.kind,
    protocol: event.protocol,
    received_at_ms: event.received_at_ms,
    replaces_id: event.replaces_id,
    sender_participant_id: event.sender_participant_id,
    target_id: event.target_id,
    text: event.text,
    topic_id: event.topic_id,
});

export const toChatComposeResultData = (result: ChatComposeResult): ChatComposeResultData => ({
    local_echo: toChatIncomingEventInfoData(result.local_echo),
    payload: new Uint8Array(result.payload),
});

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
    listPendingAgents(...args: Parameters<App['listPendingAgents']>): Promise<string[]>;
    admitAgent(...args: Parameters<App['admitAgent']>): Promise<void>;
    // Safe to call from every client that wants captions: core arbitrates who actually asks.
    requestClosedCaptions(...args: Parameters<App['requestClosedCaptions']>): Promise<void>;
    stopClosedCaptions(...args: Parameters<App['stopClosedCaptions']>): Promise<void>;
    leaveMeeting(): Promise<void>;
    triggerWebSocketReconnect(): Promise<void>;
    getJoinType(...args: Parameters<App['getJoinType']>): Promise<JoinTypeInfo>;
    getGroupKey(): Promise<GroupKeyInfoData>;
    getGroupDisplayCode(): Promise<GroupDisplayCodeData>;
    getGroupLen(): Promise<number>;
    isMlsUpToDate(): Promise<boolean>;
    isWebsocketHasReconnected(): Promise<boolean>;
    getWsState(): Promise<ConnectionStateInfo>;
    setMlsGroupUpdateHandler(): Promise<void>;
    setMlsSyncStateUpdateHandler(): Promise<void>;
    setLiveKitAdminChangeHandler(): Promise<void>;
    setAgentPendingHandler(): Promise<void>;
    setAgentLeftHandler(): Promise<void>;
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
    composeChatMessage(...args: Parameters<App['composeChatMessage']>): Promise<ChatComposeResultData>;
    composeChatReaction(...args: Parameters<App['composeChatReaction']>): Promise<ChatComposeResultData>;
    composeChatUnreact(...args: Parameters<App['composeChatUnreact']>): Promise<ChatComposeResultData>;
    decodeChat(...args: Parameters<App['decodeChat']>): Promise<ChatIncomingEventInfoData>;

    // Waiting room — guest methods
    hasMlsGroupInfo(): Promise<boolean>;
    prepareMlsSessionForWaitingRoom(...args: Parameters<App['prepareMlsSessionForWaitingRoom']>): Promise<void>;
    refreshWaitingRoomGuestSessionForJoinRequest(
        ...args: Parameters<App['refreshWaitingRoomGuestSessionForJoinRequest']>
    ): Promise<void>;
    createJoinRequest(meetLinkName: string, meetingSessionKey: string): Promise<CreateJoinRequestResult>;
    waitForWaitingRoomWelcome(meetLinkName: string): Promise<void>;
    cancelWaitingRoomJoinRequest(meetLinkName: string): Promise<void>;
    clearWaitingRoomJoinRequest(): Promise<void>;
    setJoinDecisionHandler(): Promise<void>;
    clearJoinDecisionHandler(): Promise<void>;

    // Waiting room — host methods
    setJoinRequestHandler(): Promise<void>;
    clearJoinRequestHandler(): Promise<void>;
    admitWaitingRoomJoinRequest(meetLinkName: string, requestId: string, sessionKeyBase64: string): Promise<void>;
    admitAllWaitingRoomJoinRequests(meetLinkName: string, sessionKeyBase64: string): Promise<string[]>;
    rejectWaitingRoomJoinRequest(meetLinkName: string, requestId: string, participantUid: string): Promise<void>;
    updateWaitingRoomSetting(meetLinkName: string, enable: boolean, sessionKeyBase64: string): Promise<void>;
}

export type MeetCoreRejoinReason = RejoinReasonInfo;
