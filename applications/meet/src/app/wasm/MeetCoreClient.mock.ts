import type { Mock } from 'vitest';
import { vi } from 'vitest';

import type { MeetCoreClient } from './MeetCoreClient';

export type MeetCoreClientMock = MeetCoreClient & Record<keyof MeetCoreClient, Mock>;

/**
 * Every method resolves to `undefined` by default, so awaiting and chaining `.catch()` works without
 * the test having to know which methods the code under test happens to call. Override the ones the
 * assertions depend on.
 */
const createDefaultMocks = () =>
    ({
        ping: vi.fn().mockResolvedValue(undefined),
        joinMeetingWithAccessToken: vi.fn().mockResolvedValue(undefined),
        joinMeetingWithAccessTokenWithSwitchJoinType: vi.fn().mockResolvedValue(undefined),
        joinRoomWithProposal: vi.fn().mockResolvedValue(undefined),
        leaveMeeting: vi.fn().mockResolvedValue(undefined),
        triggerWebSocketReconnect: vi.fn().mockResolvedValue(undefined),
        getJoinType: vi.fn().mockResolvedValue(undefined),
        getGroupKey: vi.fn().mockResolvedValue(undefined),
        getGroupDisplayCode: vi.fn().mockResolvedValue(undefined),
        getGroupLen: vi.fn().mockResolvedValue(undefined),
        isMlsUpToDate: vi.fn().mockResolvedValue(undefined),
        isWebsocketHasReconnected: vi.fn().mockResolvedValue(undefined),
        getWsState: vi.fn().mockResolvedValue(undefined),
        setMlsGroupUpdateHandler: vi.fn().mockResolvedValue(undefined),
        setMlsSyncStateUpdateHandler: vi.fn().mockResolvedValue(undefined),
        setLiveKitAdminChangeHandler: vi.fn().mockResolvedValue(undefined),
        setDisconnectionHandler: vi.fn().mockResolvedValue(undefined),
        setLivekitActiveUuids: vi.fn().mockResolvedValue(undefined),
        setWebsocketPingInterval: vi.fn().mockResolvedValue(undefined),
        setWebsocketPongTimeout: vi.fn().mockResolvedValue(undefined),
        setWebsocketMaxPingFailures: vi.fn().mockResolvedValue(undefined),
        encryptMessage: vi.fn().mockResolvedValue(undefined),
        decryptMessage: vi.fn().mockResolvedValue(undefined),
        logStartToJoinRoom: vi.fn().mockResolvedValue(undefined),
        logJoinedRoom: vi.fn().mockResolvedValue(undefined),
        logJoinedRoomFailed: vi.fn().mockResolvedValue(undefined),
        logConnectionLost: vi.fn().mockResolvedValue(undefined),
        logUserEpochHealth: vi.fn().mockResolvedValue(undefined),
        logUserRejoin: vi.fn().mockResolvedValue(undefined),
        tryLogDesignatedCommitter: vi.fn().mockResolvedValue(undefined),
        removeParticipant: vi.fn().mockResolvedValue(undefined),
        updateParticipantTrackSettings: vi.fn().mockResolvedValue(undefined),
        endMeeting: vi.fn().mockResolvedValue(undefined),
        dispose: vi.fn(),
        composeChatMessage: vi.fn().mockResolvedValue(undefined),
        composeChatReaction: vi.fn().mockResolvedValue(undefined),
        composeChatUnreact: vi.fn().mockResolvedValue(undefined),
        decodeChat: vi.fn().mockResolvedValue(undefined),
        hasMlsGroupInfo: vi.fn().mockResolvedValue(undefined),
        prepareMlsSessionForWaitingRoom: vi.fn().mockResolvedValue(undefined),
        refreshWaitingRoomGuestSessionForJoinRequest: vi.fn().mockResolvedValue(undefined),
        createJoinRequest: vi.fn().mockResolvedValue(undefined),
        waitForWaitingRoomWelcome: vi.fn().mockResolvedValue(undefined),
        cancelWaitingRoomJoinRequest: vi.fn().mockResolvedValue(undefined),
        clearWaitingRoomJoinRequest: vi.fn().mockResolvedValue(undefined),
        setJoinDecisionHandler: vi.fn().mockResolvedValue(undefined),
        clearJoinDecisionHandler: vi.fn().mockResolvedValue(undefined),
        setJoinRequestHandler: vi.fn().mockResolvedValue(undefined),
        clearJoinRequestHandler: vi.fn().mockResolvedValue(undefined),
        admitWaitingRoomJoinRequest: vi.fn().mockResolvedValue(undefined),
        admitAllWaitingRoomJoinRequests: vi.fn().mockResolvedValue(undefined),
        rejectWaitingRoomJoinRequest: vi.fn().mockResolvedValue(undefined),
        updateWaitingRoomSetting: vi.fn().mockResolvedValue(undefined),
    }) satisfies Record<keyof MeetCoreClient, Mock>;

export const createMeetCoreClientMock = (
    overrides: Partial<Record<keyof MeetCoreClient, Mock>> = {}
): MeetCoreClientMock => ({ ...createDefaultMocks(), ...overrides }) as MeetCoreClientMock;
