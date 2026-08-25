import { useRoomContext } from '@livekit/components-react';
import { RejoinReasonInfo } from '@proton-meet/proton-meet-core';
import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import {
    setIsReconnecting,
    setJoinedRoom,
    setMlsRetrying,
    setPrejoinParticipantCount,
    setReconnectionFailed,
} from '@proton/meet/store/slices/connectionSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { useMeetingAuthentication } from '../srp/useMeetingAuthentication';
import { useMeetingConnection } from './useMeetingConnection';

vi.mock('@livekit/components-react', () => ({ useRoomContext: vi.fn() }));
vi.mock('@proton/meet/store/hooks', () => ({ useMeetDispatch: vi.fn() }));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: vi.fn() }));
vi.mock('../../contexts/MeetCoreClientContext', () => ({ useMeetCoreClient: vi.fn() }));
vi.mock('../srp/useMeetingAuthentication', () => ({ useMeetingAuthentication: vi.fn() }));

const useRoomContextMock = useRoomContext as unknown as Mock;
const useMeetDispatchMock = useMeetDispatch as unknown as Mock;
const useFlagMock = useFlag as unknown as Mock;
const useMeetCoreClientMock = useMeetCoreClient as unknown as Mock;
const useMeetingAuthenticationMock = useMeetingAuthentication as unknown as Mock;

const mockGetAccessDetails = vi.fn();

const mockDispatch = vi.fn();

const mockRoom = {
    setE2EEEnabled: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    localParticipant: { isCameraEnabled: true, isMicrophoneEnabled: false },
};

const mockMeetCoreClient = {
    leaveMeeting: vi.fn().mockResolvedValue(undefined),
    logUserRejoin: vi.fn().mockResolvedValue(undefined),
};

const createParams = (overrides: Record<string, any> = {}): any => ({
    meetingLinkNameRef: { current: 'meeting-abc' },
    meetingPassword: 'pw',
    displayName: 'Alice',
    decryptionKeyRef: { current: null },
    mlsSetupDone: { current: false },
    accessTokenRef: { current: null },
    keyProvider: { setKeyWithEpoch: vi.fn().mockResolvedValue(undefined) },
    keyRotationScheduler: { schedule: vi.fn().mockResolvedValue(undefined) },
    handleMlsSetup: vi.fn().mockResolvedValue({ key: 'group-key', epoch: 1n }),
    reportMLSRelatedError: vi.fn(),
    connectWithStunFallbackToTurnRelay: vi.fn().mockResolvedValue({ stunFailed: false, connectionAttempts: 2 }),
    cleanupMlsState: vi.fn(),
    allowHealthCheck: vi.fn(),
    disallowHealthCheck: vi.fn(),
    initializeDevices: vi.fn().mockResolvedValue(undefined),
    getParticipants: vi.fn().mockResolvedValue(undefined),
    getQueryParticipantsCount: vi.fn().mockResolvedValue(5),
    reportMeetError: vi.fn(),
    triggerFullReconnectionRef: { current: vi.fn() },
    ...overrides,
});

const baseConnectParams = {
    meetingToken: 'meeting-abc',
    meetingPassword: 'pw',
    displayName: 'Alice',
    timeoutMs: 20_000,
};

describe('useMeetingConnection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useRoomContextMock.mockReturnValue(mockRoom);
        useMeetDispatchMock.mockReturnValue(mockDispatch);
        useMeetCoreClientMock.mockReturnValue(mockMeetCoreClient);
        mockGetAccessDetails.mockResolvedValue({ websocketUrl: 'wss://x', accessToken: 'tok' });
        useMeetingAuthenticationMock.mockReturnValue({ getAccessDetails: mockGetAccessDetails });
        useFlagMock.mockReturnValue(false);
        mockRoom.setE2EEEnabled.mockResolvedValue(undefined);
        mockRoom.disconnect.mockResolvedValue(undefined);
    });

    describe('connectWithMls', () => {
        it('runs the connect sequence and returns the connection info + participant count', async () => {
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));

            let res: any;
            await act(async () => {
                res = await result.current.connectWithMls({ ...baseConnectParams, queryParticipantsCount: true });
            });

            expect(mockGetAccessDetails).toHaveBeenCalledWith(expect.objectContaining({ token: 'meeting-abc' }));
            expect(params.handleMlsSetup).toHaveBeenCalledWith('meeting-abc', 'tok', 'pw', false);
            expect(params.keyProvider.setKeyWithEpoch).toHaveBeenCalledWith('group-key', 1n);
            expect(mockRoom.setE2EEEnabled).toHaveBeenCalledWith(true);
            expect(params.connectWithStunFallbackToTurnRelay).toHaveBeenCalledWith('wss://x', 'tok', 20_000);
            expect(params.getParticipants).toHaveBeenCalledWith('meeting-abc');

            expect(res.connectionInfo).toEqual({ stunFailed: false, connectionAttempts: 2 });
            expect(params.accessTokenRef.current).toBe('tok');
            expect(result.current.websocketUrlRef.current).toBe('wss://x');
        });

        it('uses the seamless key rotation scheduler when the flag is on', async () => {
            useFlagMock.mockImplementation((name: string) => name === 'MeetSeamlessKeyRotationEnabled');
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));

            await act(async () => {
                await result.current.connectWithMls(baseConnectParams);
            });

            expect(params.keyRotationScheduler.schedule).toHaveBeenCalledWith('group-key', 1n);
            expect(params.keyProvider.setKeyWithEpoch).not.toHaveBeenCalled();
        });

        it('dispatches the participant count to the prejoin loader without passing it to MLS', async () => {
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));

            await act(async () => {
                await result.current.connectWithMls({ ...baseConnectParams, queryParticipantsCount: true });
                await Promise.resolve();
            });

            expect(params.getQueryParticipantsCount).toHaveBeenCalledWith('meeting-abc');
            expect(mockDispatch).toHaveBeenCalledWith(setPrejoinParticipantCount(5));
            expect(params.handleMlsSetup).toHaveBeenCalledWith('meeting-abc', 'tok', 'pw', false);
        });

        it('does not query the participant count when not requested', async () => {
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));

            await act(async () => {
                await result.current.connectWithMls(baseConnectParams);
            });

            expect(params.getQueryParticipantsCount).not.toHaveBeenCalled();
            expect(mockDispatch).not.toHaveBeenCalledWith(setPrejoinParticipantCount(5));
            expect(params.handleMlsSetup).toHaveBeenCalledWith('meeting-abc', 'tok', 'pw', false);
        });

        it('forwards the waiting room flag to MLS setup', async () => {
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));

            await act(async () => {
                await result.current.connectWithMls({ ...baseConnectParams, isWaitingRoom: true });
            });

            expect(params.handleMlsSetup).toHaveBeenCalledWith('meeting-abc', 'tok', 'pw', true);
        });

        it('throws when MLS setup returns no key', async () => {
            const params = createParams({ handleMlsSetup: vi.fn().mockResolvedValue(undefined) });
            const { result } = renderHook(() => useMeetingConnection(params));

            await act(async () => {
                await expect(result.current.connectWithMls(baseConnectParams)).rejects.toThrow(
                    'Group key or epoch is missing'
                );
            });
        });

        it('leaves the MLS group and cleans up when the LiveKit connect fails', async () => {
            const params = createParams({
                connectWithStunFallbackToTurnRelay: vi.fn().mockRejectedValue(new Error('connect failed')),
            });
            const { result } = renderHook(() => useMeetingConnection(params));

            await act(async () => {
                await expect(result.current.connectWithMls(baseConnectParams)).rejects.toThrow('connect failed');
            });

            expect(mockMeetCoreClient.leaveMeeting).toHaveBeenCalledTimes(1);
            expect(params.disallowHealthCheck).toHaveBeenCalledTimes(1);
            expect(params.cleanupMlsState).toHaveBeenCalledTimes(1);
            expect(params.getParticipants).not.toHaveBeenCalled();
        });
    });

    describe('performFullReconnection', () => {
        it('no-ops when there is no meeting link name', async () => {
            const params = createParams({ meetingLinkNameRef: { current: '' } });
            const { result } = renderHook(() => useMeetingConnection(params));

            await act(async () => {
                await result.current.performFullReconnection(RejoinReasonInfo.Other);
            });

            expect(mockDispatch).not.toHaveBeenCalledWith(setIsReconnecting(true));
            expect(mockGetAccessDetails).not.toHaveBeenCalled();
        });

        it('no-ops when a reconnection is already in progress', async () => {
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));
            result.current.isReconnectingRef.current = true;

            await act(async () => {
                await result.current.performFullReconnection(RejoinReasonInfo.Other);
            });

            expect(mockDispatch).not.toHaveBeenCalledWith(setIsReconnecting(true));
        });

        it('reconnects successfully and restores the joined state', async () => {
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));

            await act(async () => {
                await result.current.performFullReconnection(RejoinReasonInfo.Other);
            });

            expect(mockDispatch).toHaveBeenCalledWith(setIsReconnecting(true));
            expect(mockDispatch).toHaveBeenCalledWith(setReconnectionFailed(false));
            expect(mockDispatch).toHaveBeenCalledWith(setMlsRetrying(false));
            expect(mockGetAccessDetails).toHaveBeenCalled();
            expect(mockDispatch).toHaveBeenCalledWith(setJoinedRoom(true));
            expect(mockDispatch).toHaveBeenCalledWith(setIsReconnecting(false));
            expect(params.allowHealthCheck).toHaveBeenCalledTimes(1);
            expect(result.current.isReconnectingRef.current).toBe(false);
        });

        it('marks the reconnection as failed and clears credentials when it throws', async () => {
            const params = createParams({
                connectWithStunFallbackToTurnRelay: vi.fn().mockRejectedValue(new Error('connect failed')),
            });
            const { result } = renderHook(() => useMeetingConnection(params));

            await act(async () => {
                await result.current.performFullReconnection(RejoinReasonInfo.Other);
            });

            expect(mockDispatch).toHaveBeenCalledWith(setReconnectionFailed(true));
            expect(params.accessTokenRef.current).toBeNull();
            expect(result.current.websocketUrlRef.current).toBeNull();
            expect(result.current.isReconnectingRef.current).toBe(false);
        });
    });
});
