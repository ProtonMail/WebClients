import { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ConnectionError } from 'livekit-client';
import type { Mock } from 'vitest';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { setJoiningInProgress } from '@proton/meet/store/slices/connectionSlice';
import {
    meetingInfoThunk,
    refreshMeetingInfoThunk,
    selectMeetingInfoModel,
} from '@proton/meet/store/slices/meetingInfoModel';
import { setJoinError } from '@proton/meet/store/slices/uiStateSlice';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';
import { CacheType } from '@proton/redux-utilities/interface';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { markAccessTokenError } from '../../utils/accessTokenError';
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
    isWebRtcSupported: vi.fn(() => true),
    room: { engine: { client: {} }, disconnect: vi.fn() },
    meetCoreClient: {
        whenReady: vi.fn(),
        logStartToJoinRoom: vi.fn(),
        logJoinedRoomFailed: vi.fn(),
        leaveMeeting: vi.fn(),
        prepareMlsSessionForWaitingRoom: vi.fn(),
        refreshWaitingRoomGuestSessionForJoinRequest: vi.fn(),
    },
}));

vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: mocks.historyPush }) }));
vi.mock('@livekit/components-react', () => ({ useRoomContext: () => mocks.room }));
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
vi.mock('@proton/shared/lib/helpers/isWebRtcSupported', () => ({ isWebRtcSupported: mocks.isWebRtcSupported }));
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
vi.mock('../../telemetry/joinPerformance', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    trackJoinSucceeded: vi.fn(),
}));

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
    mocks.isWebRtcSupported.mockReturnValue(true);
    mocks.getSessionKey.mockResolvedValue(undefined);
    mocks.meetCoreClient.whenReady.mockResolvedValue(undefined);
    mocks.meetCoreClient.logStartToJoinRoom.mockResolvedValue(undefined);
    mocks.meetCoreClient.logJoinedRoomFailed.mockResolvedValue(undefined);
    mocks.meetCoreClient.leaveMeeting.mockResolvedValue(undefined);
    mocks.room.engine.client = {};
    mocks.room.disconnect.mockResolvedValue(undefined);
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
    it('shows that the meeting is locked and asks the token request not to notify the lock as well', async () => {
        mocks.beginWaitingRoomJoin.mockResolvedValue({ handled: false, isWaitingRoomHostJoin: false });
        const { result, params } = renderJoinFlow('meeting-abc');
        params.connectWithMls.mockRejectedValue(apiError(422, 2502));

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(params.connectWithMls).toHaveBeenCalledWith(
            expect.objectContaining({ meetingLinkName: 'meeting-abc', silencedAccessTokenErrors: [2502, 2011] })
        );
        expect(dispatch).toHaveBeenCalledWith(setJoinError('meetingLocked'));
    });

    it('shows that the meeting is locked when the token refuses the join after admission', async () => {
        mockConnectWithMls.mockRejectedValue(apiError(422, 2502));
        renderJoinFlow();

        await act(async () => {
            await mocks.useWaitingRoom.mock.lastCall![0].joinAfterAdmission('meeting-abc');
        });

        expect(dispatch).toHaveBeenCalledWith(setJoinError('meetingLocked'));
        expect(mocks.notifyError).not.toHaveBeenCalled();
    });
});

describe('useJoinFlow in a browser without WebRTC', () => {
    it.each(['joinMeeting', 'joinInstantMeeting'] as const)(
        'shows that the browser is not supported and stops %s before connecting',
        async (join) => {
            mocks.isWebRtcSupported.mockReturnValue(false);
            const { result, params } = renderJoinFlow('meeting-abc');

            await act(async () => {
                await expect(result.current[join]('Alice')).rejects.toThrow('Your browser does not support WebRTC');
            });

            expect(dispatch).toHaveBeenCalledWith(setJoinError('webRtcUnsupported'));
            expect(params.connectWithMls).not.toHaveBeenCalled();
            expect(mocks.createInstantMeeting).not.toHaveBeenCalled();
        }
    );
});

describe('useJoinFlow joining a not allowed meeting', () => {
    it('shows that the meeting is not allowed and asks the token request not to notify it as well', async () => {
        mocks.beginWaitingRoomJoin.mockResolvedValue({ handled: false, isWaitingRoomHostJoin: false });
        const { result, params } = renderJoinFlow('meeting-abc');
        const error = apiError(422, 2011);
        markAccessTokenError(error);
        params.connectWithMls.mockRejectedValue(error);

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(params.connectWithMls).toHaveBeenCalledWith(
            expect.objectContaining({ meetingLinkName: 'meeting-abc', silencedAccessTokenErrors: [2502, 2011] })
        );
        expect(dispatch).toHaveBeenCalledWith(setJoinError('meetingNotAllowed'));
    });

    it('shows that the meeting is not allowed when the token refuses the join after admission', async () => {
        const error = apiError(422, 2011);
        markAccessTokenError(error);
        mockConnectWithMls.mockRejectedValue(error);
        renderJoinFlow();

        await act(async () => {
            await mocks.useWaitingRoom.mock.lastCall![0].joinAfterAdmission('meeting-abc');
        });

        expect(dispatch).toHaveBeenCalledWith(setJoinError('meetingNotAllowed'));
        expect(mocks.notifyError).not.toHaveBeenCalled();
    });

    it('shows that joining failed when another request of the join is not allowed', async () => {
        mocks.beginWaitingRoomJoin.mockResolvedValue({ handled: false, isWaitingRoomHostJoin: false });
        const { result, params } = renderJoinFlow('meeting-abc');
        params.connectWithMls.mockRejectedValue(apiError(422, 2011));

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(dispatch).toHaveBeenCalledWith(setJoinError('joinFailed'));
        expect(dispatch).not.toHaveBeenCalledWith(setJoinError('meetingNotAllowed'));
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

    it('keeps the meeting link of a failed join, for when the rejoin completes it in the background', async () => {
        mockConnectWithMls.mockRejectedValue(new Error('Connection timeout after 20000ms'));
        const { result, params } = renderJoinFlow();

        await act(async () => {
            await result.current.joinMeeting('Alice');
        });

        expect(dispatch).toHaveBeenCalledWith(setJoinError('connectionFailed'));
        expect(params.meetingLinkRef.current).toBe(getMeetingLink('meeting-abc', 'pw'));
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

    it('reads the meeting again once admitted, since its expiration time only exists once it started', async () => {
        mockConnectWithMls.mockResolvedValue({});
        renderJoinFlow();

        await act(async () => {
            await getWaitingRoomParams().joinAfterAdmission('meeting-abc');
        });

        expect(refreshMeetingInfoThunk).toHaveBeenCalledWith({ meetingLinkName: 'meeting-abc', meetingPassword: 'pw' });
    });

    it('does not read the meeting again when the join after admission fails', async () => {
        mockConnectWithMls.mockRejectedValue(new Error('Group key or epoch is missing'));
        renderJoinFlow();

        await act(async () => {
            await getWaitingRoomParams().joinAfterAdmission('meeting-abc');
        });

        expect(refreshMeetingInfoThunk).not.toHaveBeenCalled();
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

describe('useJoinFlow joinInstantMeeting', () => {
    it('does not create the meeting when meet-core failed to initialize, and unblocks the join', async () => {
        const error = new Error('init failed');
        mocks.meetCoreClient.whenReady.mockRejectedValue(error);
        const { result, params } = renderJoinFlow();

        await act(async () => {
            await result.current.joinInstantMeeting('Alice');
        });

        expect(mocks.createInstantMeeting).not.toHaveBeenCalled();
        expect(mocks.meetCoreClient.logStartToJoinRoom).not.toHaveBeenCalled();
        expect(params.reportMeetError).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith(setJoiningInProgress(false));
        expect(dispatch).toHaveBeenCalledWith(setJoinError('startFailed'));

        await act(async () => {
            await result.current.joinInstantMeeting('Alice');
        });
        expect(mocks.meetCoreClient.whenReady).toHaveBeenCalledTimes(2);
    });

    it('creates the meeting once meet-core is ready', async () => {
        mocks.createInstantMeeting.mockRejectedValue(new Error('create failed'));
        const { result } = renderJoinFlow();

        await act(async () => {
            await result.current.joinInstantMeeting('Alice');
        });

        expect(mocks.createInstantMeeting).toHaveBeenCalledTimes(1);
        expect(mocks.meetCoreClient.whenReady.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.createInstantMeeting.mock.invocationCallOrder[0]
        );
    });
});

describe('useJoinFlow leaving the join page while an instant meeting starts', () => {
    const instantMeeting = { meetingLinkName: 'instant-abc', passwordBase: 'instant-pw' };

    const leaveWhilePending = async (step: Mock, settle: (pending: PromiseWithResolvers<unknown>) => void) => {
        const pending = Promise.withResolvers<unknown>();
        step.mockReturnValue(pending.promise);
        const { result, unmount } = renderJoinFlow();

        const starting = result.current.joinInstantMeeting('Alice');
        await waitFor(() => expect(step).toHaveBeenCalled());
        unmount();
        settle(pending);
        await starting;
    };

    beforeEach(() => {
        mocks.createInstantMeeting.mockResolvedValue(instantMeeting);
        mockConnectWithMls.mockResolvedValue({});
    });

    it('does not create the meeting when the host left while meet-core got ready', async () => {
        await leaveWhilePending(mocks.meetCoreClient.whenReady, ({ resolve }) => resolve(undefined));

        expect(mocks.createInstantMeeting).not.toHaveBeenCalled();
        expect(mocks.historyPush).not.toHaveBeenCalled();
    });

    it('does not join the meeting when the host left while it was created', async () => {
        await leaveWhilePending(mocks.createInstantMeeting, ({ resolve }) => resolve(instantMeeting));

        expect(mockConnectWithMls).not.toHaveBeenCalled();
        expect(mocks.historyPush).not.toHaveBeenCalled();
    });

    it('leaves the meeting when the host left while connecting to it', async () => {
        await leaveWhilePending(mockConnectWithMls, ({ resolve }) => resolve({}));

        expect(mocks.room.disconnect).toHaveBeenCalled();
        expect(mocks.meetCoreClient.leaveMeeting).toHaveBeenCalled();
        expect(mocks.historyPush).not.toHaveBeenCalled();
    });

    it('shows no error when connecting fails after the host left', async () => {
        await leaveWhilePending(mockConnectWithMls, ({ reject }) => reject(new Error('connect failed')));

        expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: setJoinError.type }));
        expect(mocks.notifyError).not.toHaveBeenCalled();
    });
});
