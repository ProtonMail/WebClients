import { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ConnectionError } from 'livekit-client';
import type { Mock } from 'vitest';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    meetingInfoThunk,
    refreshMeetingInfoThunk,
    selectMeetingInfoModel,
} from '@proton/meet/store/slices/meetingInfoModel';
import { setJoinError } from '@proton/meet/store/slices/uiStateSlice';
import { CacheType } from '@proton/redux-utilities/interface';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { useMeetingAuthentication } from '../srp/useMeetingAuthentication';
import { useJoinFlow } from './useJoinFlow';

const mocks = vi.hoisted(() => ({
    historyPush: vi.fn(),
    createInstantMeeting: vi.fn(),
    beginWaitingRoomJoin: vi.fn(),
    useWaitingRoom: vi.fn(),
    notifyError: vi.fn(),
    getSessionKey: vi.fn(),
    enabledFlags: new Set<string>(),
    meetCoreClient: {
        logStartToJoinRoom: vi.fn(),
        logJoinedRoomFailed: vi.fn(),
        prepareMlsSessionForWaitingRoom: vi.fn(),
        refreshWaitingRoomGuestSessionForJoinRequest: vi.fn(),
    },
}));

vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: mocks.historyPush }) }));
vi.mock('@livekit/components-react', () => ({ useRoomContext: () => ({}) }));
vi.mock('@proton/components/hooks/useAuthentication', () => ({
    default: () => ({ hasSession: () => false, getUID: () => undefined }),
}));
vi.mock('@proton/meet/hooks/useCreateInstantMeeting', () => ({
    useCreateInstantMeeting: () => mocks.createInstantMeeting,
}));
vi.mock('@proton/meet/store/hooks', () => ({ useMeetDispatch: vi.fn(), useMeetSelector: vi.fn() }));
vi.mock('@proton/meet/store/slices/meetingInfoModel', () => ({
    meetingInfoThunk: vi.fn((options) => ({ type: 'meetingInfoThunk', options })),
    refreshMeetingInfoThunk: vi.fn((options) => ({ type: 'refreshMeetingInfoThunk', options })),
    selectMeetingInfoModel: vi.fn(),
}));
vi.mock('@proton/shared/lib/helpers/isWebRtcSupported', () => ({ isWebRtcSupported: () => true }));
vi.mock('@proton/meet/utils/cryptoUtils', () => ({
    deriveEncryptionKeyFromSessionKey: async () => ({}),
    encryptDisplayNameWithKey: async () => 'encrypted-name',
}));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: (name: string) => mocks.enabledFlags.has(name) }));
vi.mock('../../contexts/MeetCoreClientContext', () => ({ useMeetCoreClient: () => mocks.meetCoreClient }));
vi.mock('../srp/useMeetingAuthentication', () => ({ useMeetingAuthentication: vi.fn() }));
vi.mock('../useNotifyError', () => ({ useNotifyError: () => mocks.notifyError }));
vi.mock('./useInvalidMeetingLink', () => ({ useInvalidMeetingLink: () => ({ handleInvalidMeetingLink: vi.fn() }) }));
vi.mock('./useSessionKey', () => ({
    useSessionKey: () => ({ getSessionKey: mocks.getSessionKey, getSessionKeyBase64: vi.fn() }),
}));
vi.mock('./waitingRoom/useWaitingRoom', () => ({ useWaitingRoom: mocks.useWaitingRoom }));

const useMeetDispatchMock = useMeetDispatch as unknown as Mock;
const useMeetSelectorMock = useMeetSelector as unknown as Mock;
const useMeetingAuthenticationMock = useMeetingAuthentication as unknown as Mock;

const meetingInfo = { WaitingRoom: 1, ManageWaitingRoom: 0 };
const handshakeInfo = { SRPSession: 'srp-session' };

const mockInitHandshake = vi.fn();
const mockRefresh = vi.fn();
const mockMeetingInfo = vi.fn();
const mockConnectWithMls = vi.fn();
const mockGetAccessDetails = vi.fn();
const dispatch = vi.fn();

const createParams = (): any => ({
    urlMeetingLinkName: 'meeting-abc',
    urlMeetingPassword: 'pw',
    isInstantJoin: false,
    setDisplayName: vi.fn(),
    connectWithMls: mockConnectWithMls,
    websocketUrlRef: { current: null },
    decryptionKeyRef: { current: null },
    accessTokenRef: { current: null },
    meetingLinkRef: { current: null },
    meetingLinkNameRef: { current: '' },
    isExpiringRef: { current: false },
    joinedRoomLoggedRef: { current: false },
    setIsWebRtcUnsupportedModalOpen: vi.fn(),
    setIsMeetingLockedModalOpen: vi.fn(),
    isUsingTurnRelay: false,
    reportMeetError: vi.fn(),
    displayName: 'Alice',
    cleanupMlsState: vi.fn(),
    disallowHealthCheck: vi.fn(),
    joinTelemetryDimensions: {},
});

const renderJoinFlow = (prejoinMeetingLinkName?: string) => {
    useMeetSelectorMock.mockImplementation((selector) => {
        if (selector === selectMeetingInfoModel) {
            return { value: prejoinMeetingLinkName ? { meetingLinkName: prejoinMeetingLinkName } : undefined };
        }
        return {};
    });
    const params = createParams();
    return { ...renderHook(() => useJoinFlow(params)), params };
};

const guestSentToWaitingRoom = { handled: true };

const apiError = (status: number, code: number) =>
    Object.assign(new Error('api error'), { status, data: { Code: code, Error: 'error' } });

beforeEach(() => {
    vi.clearAllMocks();
    mocks.beginWaitingRoomJoin.mockResolvedValue(guestSentToWaitingRoom);
    mockInitHandshake.mockResolvedValue(handshakeInfo);
    mockRefresh.mockResolvedValue({ meetingInfo });
    mockMeetingInfo.mockResolvedValue({ meetingInfo });
    mocks.useWaitingRoom.mockReturnValue({ beginJoin: mocks.beginWaitingRoomJoin, providerProps: {} });
    mocks.enabledFlags.clear();
    mocks.getSessionKey.mockResolvedValue(undefined);
    mocks.meetCoreClient.logStartToJoinRoom.mockResolvedValue(undefined);
    mocks.meetCoreClient.logJoinedRoomFailed.mockResolvedValue(undefined);
    mockGetAccessDetails.mockResolvedValue({ accessToken: 'access-token', websocketUrl: 'wss://example.test' });
    useMeetingAuthenticationMock.mockReturnValue({
        initHandshake: mockInitHandshake,
        getAccessDetails: mockGetAccessDetails,
    });
    dispatch.mockImplementation((action: { type: string }) => {
        if (action.type === 'refreshMeetingInfoThunk') {
            return mockRefresh();
        }
        if (action.type === 'meetingInfoThunk') {
            return mockMeetingInfo();
        }
        return action;
    });
    useMeetDispatchMock.mockReturnValue(dispatch);
});

describe('useJoinFlow joinMeeting meeting session', () => {
    it('reuses the session the prejoin opened for the same meeting, without a new handshake', async () => {
        const { result } = renderJoinFlow('meeting-abc');

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(refreshMeetingInfoThunk).toHaveBeenCalledWith({
            meetingLinkName: 'meeting-abc',
            meetingPassword: 'pw',
            silence: [API_CUSTOM_ERROR_CODES.PERMISSION_DENIED, API_CUSTOM_ERROR_CODES.NOT_FOUND],
        });
        expect(mockInitHandshake).not.toHaveBeenCalled();
        expect(meetingInfoThunk).not.toHaveBeenCalled();
    });

    it.each([
        ['the meeting grant is gone', apiError(422, API_CUSTOM_ERROR_CODES.PERMISSION_DENIED)],
        ['the session is no longer valid', apiError(401, 401)],
    ])('runs a fresh handshake when %s', async (_, error) => {
        mockRefresh.mockRejectedValue(error);
        const { result } = renderJoinFlow('meeting-abc');

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(mockInitHandshake).toHaveBeenCalledWith('meeting-abc');
        expect(meetingInfoThunk).toHaveBeenCalledWith(
            expect.objectContaining({ meetingLinkName: 'meeting-abc', handshakeInfo, cache: CacheType.None })
        );
    });

    it('does not run a new handshake when reading the meeting fails for another reason', async () => {
        mockRefresh.mockRejectedValue(apiError(400, 2501));
        const { result } = renderJoinFlow('meeting-abc');

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(mockInitHandshake).not.toHaveBeenCalled();
        expect(meetingInfoThunk).not.toHaveBeenCalled();
    });

    it('runs the handshake when the prejoin has not loaded this meeting', async () => {
        const { result } = renderJoinFlow('another-meeting');

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(refreshMeetingInfoThunk).not.toHaveBeenCalled();
        expect(mockInitHandshake).toHaveBeenCalledWith('meeting-abc');
        expect(meetingInfoThunk).toHaveBeenCalledWith(
            expect.objectContaining({ handshakeInfo, cache: CacheType.None })
        );
    });
});

describe('useJoinFlow joining a locked meeting', () => {
    it('shows the Meeting locked modal and asks the token request not to notify the lock as well', async () => {
        mocks.beginWaitingRoomJoin.mockResolvedValue({ handled: false, isWaitingRoomHostJoin: false });
        const { result, params } = renderJoinFlow('meeting-abc');
        params.connectWithMls.mockRejectedValue(apiError(422, 2502));

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(params.connectWithMls).toHaveBeenCalledWith(
            expect.objectContaining({ meetingLinkName: 'meeting-abc', silencedAccessTokenErrors: [2502] })
        );
        expect(params.setIsMeetingLockedModalOpen).toHaveBeenCalledWith(true);
    });
});

describe('useJoinFlow join failures', () => {
    const mlsSetupError = (coreError: MeetCoreErrorEnum) =>
        Object.assign(new Error('MLS setup failed'), { userNotified: false, coreError });

    beforeEach(() => {
        mocks.beginWaitingRoomJoin.mockResolvedValue({ handled: false, isWaitingRoomHostJoin: false });
    });

    it('stops a failed join before reading the started meeting, and shows that joining failed', async () => {
        mockConnectWithMls.mockRejectedValue(new Error('Group key or epoch is missing'));
        const { result } = renderJoinFlow();

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(dispatch).toHaveBeenCalledWith(setJoinError('joinFailed'));
        expect(refreshMeetingInfoThunk).not.toHaveBeenCalled();
    });

    it('asks the connection not to notify MLS errors itself, since the join shows them', async () => {
        mockConnectWithMls.mockRejectedValue(mlsSetupError(MeetCoreErrorEnum.MaxRetriesReached));
        const { result } = renderJoinFlow();

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(mockConnectWithMls).toHaveBeenCalledWith(expect.objectContaining({ notifyMlsErrors: 'none' }));
    });

    it.each([
        {
            failure: 'connecting to LiveKit timed out',
            error: ConnectionError.timeout('signal connection timed out while waiting for the first message'),
            joinError: 'connectionFailed',
        },
        {
            failure: 'the meeting runs an older MLS version',
            error: mlsSetupError(MeetCoreErrorEnum.MlsServerVersionNotSupported),
            joinError: 'meetingOutdated',
        },
        {
            failure: 'the device clock is off',
            error: mlsSetupError(MeetCoreErrorEnum.CheckDeviceClock),
            joinError: 'deviceClock',
        },
    ] as const)('shows $joinError when $failure', async ({ error, joinError }) => {
        mockConnectWithMls.mockRejectedValue(error);
        const { result } = renderJoinFlow();

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(dispatch).toHaveBeenCalledWith(setJoinError(joinError));
    });

    it('shows the wrong password when the meeting info for the join rejects it', async () => {
        mockMeetingInfo.mockRejectedValue(apiError(422, 2026));
        const { result } = renderJoinFlow();

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(dispatch).toHaveBeenCalledWith(setJoinError('wrongPassword'));
        expect(mockConnectWithMls).not.toHaveBeenCalled();
    });

    it('stops a failed start of an instant meeting before opening its link, and shows that starting failed', async () => {
        mocks.createInstantMeeting.mockResolvedValue({ meetingLinkName: 'instant-abc', passwordBase: 'instant-pw' });
        mockConnectWithMls.mockRejectedValue(new Error('Group key or epoch is missing'));
        const { result } = renderJoinFlow();

        await act(async () => {
            await result.current.joinInstantMeeting('Alice');
        });

        expect(dispatch).toHaveBeenCalledWith(setJoinError('startFailed'));
        expect(refreshMeetingInfoThunk).not.toHaveBeenCalled();
        expect(mocks.historyPush).not.toHaveBeenCalled();
    });

    it('releases the join lock after a failed join', async () => {
        mockConnectWithMls.mockRejectedValue(new Error('Group key or epoch is missing'));
        const { result } = renderJoinFlow();

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });
        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(mockConnectWithMls).toHaveBeenCalledTimes(2);
    });

    it('ignores a second join while the first one is still connecting', async () => {
        mockConnectWithMls.mockReturnValue(new Promise(() => {}));
        const { result } = renderJoinFlow();

        await act(async () => {
            void result.current.joinMeeting('Alice');
            void result.current.joinMeeting('Alice');
        });

        await waitFor(() => expect(mockConnectWithMls).toHaveBeenCalled());
        expect(mockConnectWithMls).toHaveBeenCalledTimes(1);
    });

    it('shows the join failure without waiting for meet-core to log it', async () => {
        mocks.enabledFlags.add('MeetClientMetricsLog');
        mocks.meetCoreClient.logJoinedRoomFailed.mockReturnValue(new Promise(() => {}));
        mockConnectWithMls.mockRejectedValue(new Error('Group key or epoch is missing'));
        const { result } = renderJoinFlow();

        await act(async () => {
            void result.current.joinMeeting('Alice');
        });

        await waitFor(() => expect(mocks.meetCoreClient.logJoinedRoomFailed).toHaveBeenCalled());
        expect(dispatch).toHaveBeenCalledWith(setJoinError('joinFailed'));
    });
});

describe('useJoinFlow waiting room', () => {
    const getWaitingRoomParams = () => mocks.useWaitingRoom.mock.lastCall![0];

    beforeEach(() => {
        mocks.getSessionKey.mockResolvedValue('session-key');
    });

    it('notifies a generic failure of the join after admission instead of offering a new join', async () => {
        mockConnectWithMls.mockRejectedValue(new Error('Group key or epoch is missing'));
        renderJoinFlow();

        await act(async () => {
            await getWaitingRoomParams().joinAfterAdmission('meeting-abc');
        });

        expect(mockConnectWithMls).toHaveBeenCalledWith(expect.objectContaining({ notifyMlsErrors: 'all' }));
        expect(mocks.notifyError).toHaveBeenCalledWith('Failed to join meeting. Please try again.');
        expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: setJoinError.type }));
    });

    it.each([
        ['a connection timeout', new Error('Connection timeout after 20000ms')],
        ['a LiveKit connection timeout', ConnectionError.timeout('signal connection timed out')],
    ])('shows that the connection failed for %s of the join after admission', async (_, error) => {
        mockConnectWithMls.mockRejectedValue(error);
        renderJoinFlow();

        await act(async () => {
            await getWaitingRoomParams().joinAfterAdmission('meeting-abc');
        });

        expect(dispatch).toHaveBeenCalledWith(setJoinError('connectionFailed'));
        expect(mocks.notifyError).not.toHaveBeenCalled();
    });

    it.each(['prepareGuestSession', 'refreshGuestSession'])(
        'shows the wrong password when %s is rejected for it',
        async (sessionStep) => {
            mockGetAccessDetails.mockRejectedValue(apiError(422, 2026));
            renderJoinFlow();

            let succeeded: boolean | undefined;
            await act(async () => {
                succeeded = await getWaitingRoomParams()[sessionStep]('meeting-abc');
            });

            expect(succeeded).toBe(false);
            expect(dispatch).toHaveBeenCalledWith(setJoinError('wrongPassword'));
            expect(mocks.notifyError).not.toHaveBeenCalled();
        }
    );
});
