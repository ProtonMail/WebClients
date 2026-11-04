import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    meetingInfoThunk,
    refreshMeetingInfoThunk,
    selectMeetingInfoModel,
} from '@proton/meet/store/slices/meetingInfoModel';
import { CacheType } from '@proton/redux-utilities/interface';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { useMeetingAuthentication } from '../srp/useMeetingAuthentication';
import { useJoinFlow } from './useJoinFlow';

vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: vi.fn() }) }));
vi.mock('@livekit/components-react', () => ({ useRoomContext: () => ({}) }));
vi.mock('@proton/components/hooks/useAuthentication', () => ({
    default: () => ({ hasSession: () => false, getUID: () => undefined }),
}));
vi.mock('@proton/meet/hooks/useCreateInstantMeeting', () => ({ useCreateInstantMeeting: () => vi.fn() }));
vi.mock('@proton/meet/store/hooks', () => ({ useMeetDispatch: vi.fn(), useMeetSelector: vi.fn() }));
vi.mock('@proton/meet/store/slices/meetingInfoModel', () => ({
    meetingInfoThunk: vi.fn((options) => ({ type: 'meetingInfoThunk', options })),
    refreshMeetingInfoThunk: vi.fn((options) => ({ type: 'refreshMeetingInfoThunk', options })),
    selectMeetingInfoModel: vi.fn(),
}));
vi.mock('@proton/shared/lib/helpers/isWebRtcSupported', () => ({ isWebRtcSupported: () => true }));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }));
vi.mock('../../contexts/MeetCoreClientContext', () => ({
    useMeetCoreClient: () => ({ logStartToJoinRoom: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock('../srp/useMeetingAuthentication', () => ({ useMeetingAuthentication: vi.fn() }));
vi.mock('../useNotifyError', () => ({ useNotifyError: () => vi.fn() }));
vi.mock('./useInvalidMeetingLink', () => ({ useInvalidMeetingLink: () => ({ handleInvalidMeetingLink: vi.fn() }) }));
vi.mock('./useSessionKey', () => ({ useSessionKey: () => ({ getSessionKey: vi.fn(), getSessionKeyBase64: vi.fn() }) }));
vi.mock('./waitingRoom/useWaitingRoom', () => ({
    // Ends the join right after the meeting info, as a guest sent to the waiting room
    useWaitingRoom: () => ({ beginJoin: vi.fn().mockResolvedValue({ handled: true }), providerProps: {} }),
}));

const useMeetDispatchMock = useMeetDispatch as unknown as Mock;
const useMeetSelectorMock = useMeetSelector as unknown as Mock;
const useMeetingAuthenticationMock = useMeetingAuthentication as unknown as Mock;

const meetingInfo = { WaitingRoom: 1, ManageWaitingRoom: 0 };
const handshakeInfo = { SRPSession: 'srp-session' };

const mockInitHandshake = vi.fn();
const mockRefresh = vi.fn();

const createParams = (): any => ({
    urlMeetingLinkName: 'meeting-abc',
    urlMeetingPassword: 'pw',
    isInstantJoin: false,
    setDisplayName: vi.fn(),
    connectWithMls: vi.fn(),
    websocketUrlRef: { current: null },
    decryptionKeyRef: { current: null },
    accessTokenRef: { current: null },
    meetingLinkRef: { current: null },
    meetingLinkNameRef: { current: '' },
    isExpiringRef: { current: false },
    joinedRoomLoggedRef: { current: false },
    setIsWebRtcUnsupportedModalOpen: vi.fn(),
    setIsMeetingLockedModalOpen: vi.fn(),
    setIsConnectionFailedModalOpen: vi.fn(),
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
    return renderHook(() => useJoinFlow(createParams()));
};

const apiError = (status: number, code: number) =>
    Object.assign(new Error('api error'), { status, data: { Code: code, Error: 'error' } });

describe('useJoinFlow joinMeeting meeting session', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockInitHandshake.mockResolvedValue(handshakeInfo);
        mockRefresh.mockResolvedValue({ meetingInfo });
        useMeetingAuthenticationMock.mockReturnValue({ initHandshake: mockInitHandshake, getAccessDetails: vi.fn() });
        useMeetDispatchMock.mockReturnValue((action: { type: string }) => {
            if (action.type === 'refreshMeetingInfoThunk') {
                return mockRefresh();
            }
            if (action.type === 'meetingInfoThunk') {
                return Promise.resolve({ meetingInfo });
            }
            return action;
        });
    });

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
