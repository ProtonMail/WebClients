import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { MeetCoreErrorEnum, RejoinReasonInfo } from '@proton-meet/proton-meet-core';
import { act, renderHook } from '@testing-library/react';
import { ConnectionError, ConnectionState } from 'livekit-client';
import type { Mock } from 'vitest';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import {
    setIsReconnecting,
    setJoinedRoom,
    setMlsRetrying,
    setPrejoinParticipantCount,
    setReconnectionFailed,
} from '@proton/meet/store/slices/connectionSlice';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { MEET_CORE_JOIN_TIMEOUT_MS, MEET_CORE_STALL_TIMEOUT_MS } from '../../wasm/meetCoreStallRecovery';
import { useMeetingAuthentication } from '../srp/useMeetingAuthentication';
import { OFFLINE_GIVE_UP_MS, OFFLINE_RECHECK_MS, REJOIN_RETRY_DELAYS_MS } from './rejoinAttempts';
import {
    type MeetingAccessDetails,
    type UseMeetingConnectionResult,
    useMeetingConnection,
} from './useMeetingConnection';

vi.mock('@livekit/components-react', () => ({ useRoomContext: vi.fn(), useLocalParticipant: vi.fn() }));
vi.mock('@proton/meet/store/hooks', () => ({ useMeetDispatch: vi.fn() }));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: vi.fn() }));
vi.mock('../../contexts/MeetCoreClientContext', () => ({ useMeetCoreClient: vi.fn() }));
vi.mock('../srp/useMeetingAuthentication', () => ({ useMeetingAuthentication: vi.fn() }));

const useRoomContextMock = useRoomContext as unknown as Mock;
const useLocalParticipantMock = useLocalParticipant as unknown as Mock;
const useMeetDispatchMock = useMeetDispatch as unknown as Mock;
const useFlagMock = useFlag as unknown as Mock;
const useMeetCoreClientMock = useMeetCoreClient as unknown as Mock;
const useMeetingAuthenticationMock = useMeetingAuthentication as unknown as Mock;

const mockGetAccessDetails = vi.fn();

const mockDispatch = vi.fn();

const mockRoom = {
    state: ConnectionState.Disconnected,
    setE2EEEnabled: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
};

const setLocalDevices = (isCameraEnabled: boolean, isMicrophoneEnabled: boolean) =>
    useLocalParticipantMock.mockReturnValue({ isCameraEnabled, isMicrophoneEnabled });

const createDeferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((onResolve, onReject) => {
        resolve = onResolve;
        reject = onReject;
    });
    return { promise, resolve, reject };
};

const mockMeetCoreClient = {
    leaveMeeting: vi.fn().mockResolvedValue(undefined),
    logUserRejoin: vi.fn().mockResolvedValue(undefined),
    restart: vi.fn().mockResolvedValue(true),
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
    meetingLinkName: 'meeting-abc',
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
        mockRoom.state = ConnectionState.Disconnected;
        setLocalDevices(true, false);
        mockRoom.setE2EEEnabled.mockResolvedValue(undefined);
        mockRoom.disconnect.mockResolvedValue(undefined);
        mockMeetCoreClient.restart.mockResolvedValue(true);
    });

    describe('connectWithMls', () => {
        it('runs the connect sequence and returns the connection info + participant count', async () => {
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));

            let res: any;
            await act(async () => {
                res = await result.current.connectWithMls({ ...baseConnectParams, queryParticipantsCount: true });
            });

            expect(mockGetAccessDetails).toHaveBeenCalledWith(
                expect.objectContaining({ meetingLinkName: 'meeting-abc' })
            );
            expect(params.handleMlsSetup).toHaveBeenCalledWith('meeting-abc', 'tok', 'pw', false, true);
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
            expect(params.handleMlsSetup).toHaveBeenCalledWith('meeting-abc', 'tok', 'pw', false, true);
        });

        it('does not query the participant count when not requested', async () => {
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));

            await act(async () => {
                await result.current.connectWithMls(baseConnectParams);
            });

            expect(params.getQueryParticipantsCount).not.toHaveBeenCalled();
            expect(mockDispatch).not.toHaveBeenCalledWith(setPrejoinParticipantCount(5));
            expect(params.handleMlsSetup).toHaveBeenCalledWith('meeting-abc', 'tok', 'pw', false, true);
        });

        it('forwards the waiting room flag to MLS setup', async () => {
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));

            await act(async () => {
                await result.current.connectWithMls({ ...baseConnectParams, isWaitingRoom: true });
            });

            expect(params.handleMlsSetup).toHaveBeenCalledWith('meeting-abc', 'tok', 'pw', true, true);
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

            let status;
            await act(async () => {
                status = await result.current.performFullReconnection(RejoinReasonInfo.Other);
            });

            expect(status).toBe('skipped');
            expect(mockDispatch).not.toHaveBeenCalledWith(setIsReconnecting(true));
            expect(mockGetAccessDetails).not.toHaveBeenCalled();
        });

        it('no-ops when a reconnection is already in progress', async () => {
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));
            result.current.isReconnectingRef.current = true;

            let status;
            await act(async () => {
                status = await result.current.performFullReconnection(RejoinReasonInfo.Other);
            });

            expect(status).toBe('skipped');
            expect(mockDispatch).not.toHaveBeenCalledWith(setIsReconnecting(true));
        });

        it('reconnects successfully and restores the joined state', async () => {
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));

            let status;
            await act(async () => {
                status = await result.current.performFullReconnection(RejoinReasonInfo.Other);
            });

            expect(status).toBe('joined');
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

            let status;
            await act(async () => {
                status = await result.current.performFullReconnection(RejoinReasonInfo.Other);
            });

            expect(status).toBe('failed');
            expect(mockDispatch).toHaveBeenCalledWith(setReconnectionFailed(true));
            expect(params.accessTokenRef.current).toBeNull();
            expect(result.current.websocketUrlRef.current).toBeNull();
            expect(result.current.isReconnectingRef.current).toBe(false);
        });

        describe('when leaving the MLS group hangs', () => {
            beforeEach(() => {
                vi.useFakeTimers();
                useFlagMock.mockImplementation((name: string) => name === 'MeetHandleStalledLiveKitReconnect');
            });
            afterEach(() => vi.useRealTimers());

            it('does not restart meet-core when MeetHandleStalledLiveKitReconnect is disabled', async () => {
                useFlagMock.mockReturnValue(false);
                mockMeetCoreClient.leaveMeeting.mockReturnValueOnce(new Promise(() => {}));
                const params = createParams({ mlsSetupDone: { current: true } });
                const { result } = renderHook(() => useMeetingConnection(params));

                await act(async () => {
                    void result.current.performFullReconnection(RejoinReasonInfo.LivekitConnectionTimeout);
                    await vi.advanceTimersByTimeAsync(MEET_CORE_STALL_TIMEOUT_MS);
                });

                expect(mockMeetCoreClient.restart).not.toHaveBeenCalled();
                expect(params.handleMlsSetup).not.toHaveBeenCalled();
            });

            it('restarts meet-core and still rejoins after a LiveKit stall', async () => {
                mockMeetCoreClient.leaveMeeting.mockReturnValueOnce(new Promise(() => {}));
                const params = createParams({ mlsSetupDone: { current: true } });
                const { result } = renderHook(() => useMeetingConnection(params));

                await act(async () => {
                    const reconnection = result.current.performFullReconnection(
                        RejoinReasonInfo.LivekitConnectionTimeout
                    );
                    await vi.advanceTimersByTimeAsync(MEET_CORE_STALL_TIMEOUT_MS);
                    await reconnection;
                });

                expect(mockMeetCoreClient.restart).toHaveBeenCalledTimes(1);
                expect(params.reportMeetError).toHaveBeenCalledWith(
                    'Meet core leaveMeeting timed out',
                    expect.anything()
                );
                expect(params.handleMlsSetup).toHaveBeenCalled();
                expect(mockDispatch).toHaveBeenCalledWith(setJoinedRoom(true));
                expect(result.current.isReconnectingRef.current).toBe(false);
            });

            it.each([
                RejoinReasonInfo.Other,
                RejoinReasonInfo.EpochMismatch,
                RejoinReasonInfo.LivekitStateMismatch,
                RejoinReasonInfo.FetchTimeout,
            ])('restarts meet-core and still rejoins for reason %s', async (reason) => {
                mockMeetCoreClient.leaveMeeting.mockReturnValueOnce(new Promise(() => {}));
                const params = createParams({ mlsSetupDone: { current: true } });
                const { result } = renderHook(() => useMeetingConnection(params));

                let status;
                await act(async () => {
                    const reconnection = result.current.performFullReconnection(reason);
                    await vi.advanceTimersByTimeAsync(MEET_CORE_STALL_TIMEOUT_MS);
                    status = await reconnection;
                });

                expect(status).toBe('joined');
                expect(mockMeetCoreClient.restart).toHaveBeenCalledTimes(1);
                expect(params.handleMlsSetup).toHaveBeenCalled();
            });

            it('restarts meet-core and retries when the leave after a failed LiveKit connect hangs', async () => {
                mockMeetCoreClient.leaveMeeting.mockReturnValueOnce(new Promise(() => {}));
                const params = createParams({
                    connectWithStunFallbackToTurnRelay: vi
                        .fn()
                        .mockRejectedValueOnce(
                            ConnectionError.serverUnreachable('could not establish signal connection')
                        )
                        .mockResolvedValue({ stunFailed: false, connectionAttempts: 1 }),
                });
                const { result } = renderHook(() => useMeetingConnection(params));

                const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
                await act(() => vi.advanceTimersByTimeAsync(MEET_CORE_STALL_TIMEOUT_MS));

                expect(mockMeetCoreClient.restart).toHaveBeenCalledTimes(1);
                expect(params.reportMeetError).toHaveBeenCalledWith(
                    'Meet core leaveMeeting timed out',
                    expect.anything()
                );

                await act(() => vi.advanceTimersByTimeAsync(REJOIN_RETRY_DELAYS_MS[0]));

                await expect(run).resolves.toBe('joined');
                expect(params.connectWithStunFallbackToTurnRelay).toHaveBeenCalledTimes(2);
            });
        });

        describe('when joining the MLS group hangs', () => {
            const neverSettles = () => new Promise<never>(() => {});

            beforeEach(() => {
                vi.useFakeTimers();
                useFlagMock.mockImplementation((name: string) => name === 'MeetHandleStalledLiveKitReconnect');
            });
            afterEach(() => vi.useRealTimers());

            it('abandons the join at the deadline, restarting meet-core, and rejoins on the next attempt', async () => {
                const params = createParams({
                    handleMlsSetup: vi
                        .fn()
                        .mockImplementationOnce(neverSettles)
                        .mockResolvedValue({ key: 'group-key', epoch: 1n }),
                });
                const { result } = renderHook(() => useMeetingConnection(params));

                const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
                await act(() => vi.advanceTimersByTimeAsync(MEET_CORE_JOIN_TIMEOUT_MS - 1));
                expect(mockMeetCoreClient.restart).not.toHaveBeenCalled();

                await act(() => vi.advanceTimersByTimeAsync(1));
                expect(mockMeetCoreClient.restart).toHaveBeenCalledTimes(1);
                expect(params.reportMeetError).toHaveBeenCalledWith('Meet core joinMeeting timed out', {
                    context: { timeoutMs: MEET_CORE_JOIN_TIMEOUT_MS, restarted: true },
                });

                await act(() => vi.advanceTimersByTimeAsync(REJOIN_RETRY_DELAYS_MS[0]));

                await expect(run).resolves.toBe('joined');
                expect(params.handleMlsSetup).toHaveBeenCalledTimes(2);
                expect(mockDispatch).not.toHaveBeenCalledWith(setReconnectionFailed(true));
                expect(result.current.isReconnectingRef.current).toBe(false);
            });

            it('fails the rejoin when meet-core cannot restart, even though leaving the group then hangs too', async () => {
                mockMeetCoreClient.restart.mockResolvedValue(false);
                mockMeetCoreClient.leaveMeeting.mockReturnValueOnce(neverSettles());
                const params = createParams();
                params.handleMlsSetup.mockImplementation(() => {
                    params.mlsSetupDone.current = true;
                    return neverSettles();
                });
                const { result } = renderHook(() => useMeetingConnection(params));

                const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
                await act(() => vi.advanceTimersByTimeAsync(MEET_CORE_JOIN_TIMEOUT_MS + MEET_CORE_STALL_TIMEOUT_MS));

                await expect(run).resolves.toBe('failed');
                expect(params.reportMeetError).toHaveBeenCalledWith('Full reconnection failed', {
                    context: { error: expect.objectContaining({ restarted: false }), attempts: 1 },
                });
                expect(mockDispatch).toHaveBeenCalledWith(setReconnectionFailed(true));
            });

            it('a rejoin cancelled while the join hangs stops waiting and restarts meet-core', async () => {
                const params = createParams({ handleMlsSetup: vi.fn(neverSettles) });
                const { result } = renderHook(() => useMeetingConnection(params));

                const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
                await vi.waitFor(() => expect(params.handleMlsSetup).toHaveBeenCalled());
                result.current.cancelReconnection();
                expect(mockMeetCoreClient.restart).toHaveBeenCalledTimes(1);
                const dispatchCountAtCancel = mockDispatch.mock.calls.length;

                await expect(run).resolves.toBe('cancelled');
                await act(() => vi.advanceTimersByTimeAsync(MEET_CORE_JOIN_TIMEOUT_MS));
                expect(mockMeetCoreClient.restart).toHaveBeenCalledTimes(1);
                expect(mockDispatch).toHaveBeenCalledTimes(dispatchCountAtCancel);
                expect(params.reportMeetError).not.toHaveBeenCalled();
            });

            it('waits for the join however long it takes when MeetHandleStalledLiveKitReconnect is disabled', async () => {
                useFlagMock.mockReturnValue(false);
                const params = createParams({ handleMlsSetup: vi.fn(neverSettles) });
                const { result } = renderHook(() => useMeetingConnection(params));

                void result.current.performFullReconnection(RejoinReasonInfo.Other);
                await act(() => vi.advanceTimersByTimeAsync(10 * MEET_CORE_JOIN_TIMEOUT_MS));

                expect(mockMeetCoreClient.restart).not.toHaveBeenCalled();
                expect(mockDispatch).not.toHaveBeenCalledWith(setReconnectionFailed(true));
                expect(result.current.isReconnectingRef.current).toBe(true);
            });
        });

        describe('MLS join failure notifications', () => {
            it('a rejoin leaves them to the rejoin UI when MeetHandleStalledLiveKitReconnect is enabled', async () => {
                useFlagMock.mockImplementation((name: string) => name === 'MeetHandleStalledLiveKitReconnect');
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));

                await act(() => result.current.performFullReconnection(RejoinReasonInfo.Other));

                expect(params.handleMlsSetup).toHaveBeenCalledWith('meeting-abc', 'tok', 'pw', false, false);
            });

            it('a rejoin still shows them when MeetHandleStalledLiveKitReconnect is disabled', async () => {
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));

                await act(() => result.current.performFullReconnection(RejoinReasonInfo.Other));

                expect(params.handleMlsSetup).toHaveBeenCalledWith('meeting-abc', 'tok', 'pw', false, true);
            });

            it('the initial join shows them when MeetHandleStalledLiveKitReconnect is enabled', async () => {
                useFlagMock.mockImplementation((name: string) => name === 'MeetHandleStalledLiveKitReconnect');
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));

                await act(() => result.current.connectWithMls(baseConnectParams));

                expect(params.handleMlsSetup).toHaveBeenCalledWith('meeting-abc', 'tok', 'pw', false, true);
            });
        });

        describe('when a rejoin attempt fails', () => {
            const offlineError = Object.assign(new Error('Offline'), { name: 'OfflineError' });
            const networkError = Object.assign(new Error('Network error'), { name: 'NetworkError' });
            const allRetryDelaysMs = REJOIN_RETRY_DELAYS_MS.reduce((total, delayMs) => total + delayMs, 0);
            let isOnline: boolean;

            beforeEach(() => {
                vi.useFakeTimers();
                isOnline = true;
                vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => isOnline);
                vi.spyOn(Math, 'random').mockReturnValue(1);
                useFlagMock.mockImplementation(
                    (name: string) => name === 'MeetHandleStalledLiveKitReconnect' || name === 'MeetClientMetricsLog'
                );
            });
            afterEach(() => {
                vi.restoreAllMocks();
                vi.useRealTimers();
            });

            it('waits offline without the Connection lost modal, and rejoins once the browser is back online', async () => {
                isOnline = false;
                mockGetAccessDetails.mockRejectedValueOnce(offlineError);
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));

                const run = result.current.performFullReconnection(RejoinReasonInfo.EpochMismatch);
                await act(() => vi.advanceTimersByTimeAsync(2 * OFFLINE_RECHECK_MS - 1));

                expect(mockGetAccessDetails).toHaveBeenCalledTimes(1);
                expect(mockDispatch).not.toHaveBeenCalledWith(setReconnectionFailed(true));
                expect(mockDispatch).not.toHaveBeenCalledWith(setIsReconnecting(false));
                expect(result.current.isReconnectingRef.current).toBe(true);

                isOnline = true;
                act(() => {
                    window.dispatchEvent(new Event('online'));
                });

                await expect(run).resolves.toBe('joined');
                expect(mockGetAccessDetails).toHaveBeenCalledTimes(2);
                expect(mockDispatch).toHaveBeenCalledWith(setJoinedRoom(true));
                expect(mockDispatch).not.toHaveBeenCalledWith(setReconnectionFailed(true));
                expect(vi.getTimerCount()).toBe(0);
            });

            it('retries a failed meet-core join and rejoins', async () => {
                const params = createParams({
                    handleMlsSetup: vi
                        .fn()
                        .mockRejectedValueOnce(
                            Object.assign(new Error('MLS setup failed: HttpClientError'), {
                                coreError: MeetCoreErrorEnum.HttpClientError,
                            })
                        )
                        .mockResolvedValue({ key: 'group-key', epoch: 1n }),
                });
                const { result } = renderHook(() => useMeetingConnection(params));

                const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
                await act(() => vi.advanceTimersByTimeAsync(REJOIN_RETRY_DELAYS_MS[0]));

                await expect(run).resolves.toBe('joined');
                expect(params.handleMlsSetup).toHaveBeenCalledTimes(2);
                expect(mockDispatch).not.toHaveBeenCalledWith(setReconnectionFailed(true));
            });

            it('reports the real attempt count to the rejoin telemetry', async () => {
                mockGetAccessDetails.mockRejectedValueOnce(networkError);
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));

                const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
                await act(() => vi.advanceTimersByTimeAsync(REJOIN_RETRY_DELAYS_MS[0]));

                await expect(run).resolves.toBe('joined');
                expect(mockMeetCoreClient.logUserRejoin).toHaveBeenCalledTimes(1);
                expect(mockMeetCoreClient.logUserRejoin).toHaveBeenCalledWith(
                    expect.any(BigInt),
                    2,
                    RejoinReasonInfo.Other,
                    true
                );
            });

            it('shows the Connection lost modal and reports the failure once, after the last attempt', async () => {
                mockGetAccessDetails.mockRejectedValue(networkError);
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));
                const attempts = REJOIN_RETRY_DELAYS_MS.length + 1;

                const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
                await act(() => vi.advanceTimersByTimeAsync(allRetryDelaysMs - 1));
                expect(mockDispatch).not.toHaveBeenCalledWith(setReconnectionFailed(true));
                expect(params.reportMeetError).not.toHaveBeenCalledWith('Full reconnection failed', expect.anything());

                await act(() => vi.advanceTimersByTimeAsync(1));

                await expect(run).resolves.toBe('failed');
                expect(mockGetAccessDetails).toHaveBeenCalledTimes(attempts);
                expect(mockDispatch).toHaveBeenCalledWith(setReconnectionFailed(true));
                expect(params.reportMeetError).toHaveBeenCalledTimes(1);
                expect(params.reportMeetError).toHaveBeenCalledWith('Full reconnection failed', {
                    context: { error: networkError, attempts },
                });
                expect(mockMeetCoreClient.logUserRejoin).toHaveBeenCalledWith(
                    expect.any(BigInt),
                    attempts,
                    RejoinReasonInfo.Other,
                    false
                );
            });

            it('restores the camera and microphone as they were before the first attempt', async () => {
                mockRoom.state = ConnectionState.Connected;
                setLocalDevices(true, true);
                mockRoom.disconnect.mockImplementation(async () => {
                    setLocalDevices(false, false);
                });
                const params = createParams({
                    connectWithStunFallbackToTurnRelay: vi
                        .fn()
                        .mockRejectedValueOnce(
                            ConnectionError.serverUnreachable('could not establish signal connection')
                        )
                        .mockResolvedValue({ stunFailed: false, connectionAttempts: 1 }),
                });
                const { result } = renderHook(() => useMeetingConnection(params));

                const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
                await act(() => vi.advanceTimersByTimeAsync(REJOIN_RETRY_DELAYS_MS[0]));

                await expect(run).resolves.toBe('joined');
                expect(params.initializeDevices).toHaveBeenCalledTimes(2);
                expect(params.initializeDevices).toHaveBeenLastCalledWith(
                    expect.objectContaining({ desiredCameraState: true, desiredMicrophoneState: true })
                );
            });

            describe('restoring devices after a connection loss', () => {
                // LiveKit unpublishes local tracks before it reports Disconnected
                const loseConnection = (rerender: () => void) => {
                    setLocalDevices(false, false);
                    mockRoom.state = ConnectionState.Disconnected;
                    act(() => rerender());
                };

                it.each([
                    { camera: true, microphone: true },
                    { camera: true, microphone: false },
                    { camera: false, microphone: true },
                    { camera: false, microphone: false },
                ])('restores camera $camera and microphone $microphone after a disconnect', async (before) => {
                    mockRoom.state = ConnectionState.Connected;
                    setLocalDevices(before.camera, before.microphone);
                    const params = createParams();
                    const { result, rerender } = renderHook(() => useMeetingConnection(params));
                    loseConnection(rerender);

                    await expect(
                        result.current.performFullReconnection(RejoinReasonInfo.WebsocketDisconnected)
                    ).resolves.toBe('joined');

                    expect(params.initializeDevices).toHaveBeenCalledWith(
                        expect.objectContaining({
                            desiredCameraState: before.camera,
                            desiredMicrophoneState: before.microphone,
                        })
                    );
                });

                it('keeps the pre-loss state when a half-connected room is rendered during a failed run', async () => {
                    mockRoom.state = ConnectionState.Connected;
                    setLocalDevices(true, true);
                    const params = createParams();
                    const { result, rerender } = renderHook(() => useMeetingConnection(params));
                    loseConnection(rerender);
                    params.connectWithStunFallbackToTurnRelay.mockImplementationOnce(async () => {
                        mockRoom.state = ConnectionState.Connected;
                        act(() => rerender());
                        throw new Error('not retryable');
                    });

                    await expect(
                        result.current.performFullReconnection(RejoinReasonInfo.WebsocketDisconnected)
                    ).resolves.toBe('failed');
                    await expect(
                        result.current.performFullReconnection(RejoinReasonInfo.Other, { manual: true })
                    ).resolves.toBe('joined');

                    expect(params.initializeDevices).toHaveBeenLastCalledWith(
                        expect.objectContaining({ desiredCameraState: true, desiredMicrophoneState: true })
                    );
                });
            });

            it('a rejoin cancelled while waiting to retry makes no further attempt and changes nothing', async () => {
                mockGetAccessDetails.mockRejectedValueOnce(networkError);
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));

                const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
                await act(() => vi.advanceTimersByTimeAsync(1));
                expect(mockGetAccessDetails).toHaveBeenCalledTimes(1);
                result.current.cancelReconnection();
                mockDispatch.mockClear();

                await expect(run).resolves.toBe('cancelled');
                expect(vi.getTimerCount()).toBe(0);
                await act(() => vi.advanceTimersByTimeAsync(allRetryDelaysMs));
                expect(mockGetAccessDetails).toHaveBeenCalledTimes(1);
                expect(mockDispatch).not.toHaveBeenCalled();
                expect(params.reportMeetError).not.toHaveBeenCalled();
                expect(mockMeetCoreClient.logUserRejoin).not.toHaveBeenCalled();
            });

            it('makes one attempt, even offline, when MeetHandleStalledLiveKitReconnect is disabled', async () => {
                useFlagMock.mockImplementation((name: string) => name === 'MeetClientMetricsLog');
                isOnline = false;
                mockGetAccessDetails.mockRejectedValue(offlineError);
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));

                const run = result.current.performFullReconnection(RejoinReasonInfo.Other);

                await expect(run).resolves.toBe('failed');
                await act(() => vi.advanceTimersByTimeAsync(OFFLINE_GIVE_UP_MS));
                expect(mockGetAccessDetails).toHaveBeenCalledTimes(1);
                expect(mockDispatch).toHaveBeenCalledWith(setReconnectionFailed(true));
                expect(mockMeetCoreClient.logUserRejoin).toHaveBeenCalledWith(
                    expect.any(BigInt),
                    1,
                    RejoinReasonInfo.Other,
                    false
                );
            });
        });

        describe('when the server keeps disconnecting right after each rejoin', () => {
            const reason = RejoinReasonInfo.LivekitConnectionTimeout;

            const rejoinThreeTimesThirtySecondsApart = async (connection: { current: UseMeetingConnectionResult }) => {
                for (let run = 0; run < 3; run += 1) {
                    await expect(connection.current.performFullReconnection(reason)).resolves.toBe('joined');
                    await act(() => vi.advanceTimersByTimeAsync(30 * SECOND));
                }
            };

            beforeEach(() => {
                vi.useFakeTimers();
                useFlagMock.mockImplementation(
                    (name: string) => name === 'MeetHandleStalledLiveKitReconnect' || name === 'MeetClientMetricsLog'
                );
            });
            afterEach(() => vi.useRealTimers());

            it('a 4th automatic rejoin within 2 minutes shows the Connection lost modal without connecting', async () => {
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));
                await rejoinThreeTimesThirtySecondsApart(result);

                await expect(result.current.performFullReconnection(reason)).resolves.toBe('failed');

                expect(mockGetAccessDetails).toHaveBeenCalledTimes(3);
                expect(params.handleMlsSetup).toHaveBeenCalledTimes(3);
                expect(params.connectWithStunFallbackToTurnRelay).toHaveBeenCalledTimes(3);
                expect(mockDispatch).toHaveBeenLastCalledWith(setReconnectionFailed(true));
                expect(result.current.isReconnectingRef.current).toBe(false);
                expect(params.accessTokenRef.current).toBeNull();
                expect(result.current.websocketUrlRef.current).toBeNull();
                expect(params.reportMeetError).toHaveBeenCalledTimes(1);
                expect(params.reportMeetError).toHaveBeenCalledWith('Automatic rejoin limit reached', {
                    level: 'warning',
                    context: { runs: 3, windowMs: 2 * MINUTE },
                });
                expect(mockMeetCoreClient.logUserRejoin).toHaveBeenLastCalledWith(expect.any(BigInt), 0, reason, false);
            });

            it('a capped rejoin disconnects the room and leaves meet-core', async () => {
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));
                await rejoinThreeTimesThirtySecondsApart(result);
                params.mlsSetupDone.current = true;
                mockRoom.disconnect.mockClear();
                params.cleanupMlsState.mockClear();

                await expect(result.current.performFullReconnection(reason)).resolves.toBe('failed');

                expect(mockRoom.disconnect).toHaveBeenCalledTimes(1);
                expect(mockMeetCoreClient.leaveMeeting).toHaveBeenCalledTimes(1);
                expect(mockRoom.disconnect.mock.invocationCallOrder[0]).toBeLessThan(
                    mockMeetCoreClient.leaveMeeting.mock.invocationCallOrder[0]
                );
                expect(params.mlsSetupDone.current).toBe(false);
                expect(params.cleanupMlsState).toHaveBeenCalled();
                expect(params.handleMlsSetup).toHaveBeenCalledTimes(3);
            });

            it('a capped rejoin cancelled while the room disconnects resolves cancelled and changes nothing afterwards', async () => {
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));
                await rejoinThreeTimesThirtySecondsApart(result);
                params.mlsSetupDone.current = true;
                const pendingDisconnect = createDeferred<void>();
                mockRoom.disconnect.mockReturnValueOnce(pendingDisconnect.promise);

                const run = result.current.performFullReconnection(reason);
                await vi.waitFor(() => expect(mockRoom.disconnect).toHaveBeenCalledTimes(4));
                result.current.cancelReconnection();
                mockDispatch.mockClear();
                mockMeetCoreClient.logUserRejoin.mockClear();
                pendingDisconnect.resolve();

                await expect(run).resolves.toBe('cancelled');
                expect(mockMeetCoreClient.leaveMeeting).not.toHaveBeenCalled();
                expect(params.mlsSetupDone.current).toBe(true);
                expect(mockDispatch).not.toHaveBeenCalled();
                expect(params.reportMeetError).not.toHaveBeenCalled();
                expect(mockMeetCoreClient.logUserRejoin).not.toHaveBeenCalled();
            });

            it('an automatic rejoin more than 2 minutes after the oldest counted one rejoins, and the window slides', async () => {
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));
                await rejoinThreeTimesThirtySecondsApart(result);
                await act(() => vi.advanceTimersByTimeAsync(30 * SECOND + 1));

                await expect(result.current.performFullReconnection(reason)).resolves.toBe('joined');
                await expect(result.current.performFullReconnection(reason)).resolves.toBe('failed');
                expect(mockGetAccessDetails).toHaveBeenCalledTimes(4);
            });

            it('a manual rejoin after the cap rejoins and starts a fresh count without counting itself', async () => {
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));
                await rejoinThreeTimesThirtySecondsApart(result);
                await expect(result.current.performFullReconnection(reason)).resolves.toBe('failed');

                await expect(
                    result.current.performFullReconnection(RejoinReasonInfo.Other, { manual: true })
                ).resolves.toBe('joined');
                await rejoinThreeTimesThirtySecondsApart(result);

                expect(mockGetAccessDetails).toHaveBeenCalledTimes(7);
                await expect(result.current.performFullReconnection(reason)).resolves.toBe('failed');
            });

            it('leaving the meeting with no active run starts a fresh count for the next session', async () => {
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));
                await rejoinThreeTimesThirtySecondsApart(result);
                await expect(result.current.performFullReconnection(reason)).resolves.toBe('failed');

                result.current.cancelReconnection();

                await expect(result.current.performFullReconnection(reason)).resolves.toBe('joined');
                expect(params.connectWithStunFallbackToTurnRelay).toHaveBeenCalledTimes(4);
            });

            it('a skipped rejoin does not count', async () => {
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));
                result.current.isReconnectingRef.current = true;
                await expect(result.current.performFullReconnection(reason)).resolves.toBe('skipped');
                result.current.isReconnectingRef.current = false;

                await rejoinThreeTimesThirtySecondsApart(result);
            });

            it('has no limit when MeetHandleStalledLiveKitReconnect is disabled', async () => {
                useFlagMock.mockImplementation((name: string) => name === 'MeetClientMetricsLog');
                const params = createParams();
                const { result } = renderHook(() => useMeetingConnection(params));
                await rejoinThreeTimesThirtySecondsApart(result);

                await expect(result.current.performFullReconnection(reason)).resolves.toBe('joined');
                expect(mockGetAccessDetails).toHaveBeenCalledTimes(4);
                expect(mockDispatch).not.toHaveBeenCalledWith(setReconnectionFailed(true));
            });
        });
    });

    describe('cancelReconnection', () => {
        beforeEach(() => {
            useFlagMock.mockImplementation((name: string) => name === 'MeetClientMetricsLog');
        });

        it.each([
            { step: 'the room disconnects', getPendingCall: () => mockRoom.disconnect },
            { step: 'it leaves the MLS group', getPendingCall: () => mockMeetCoreClient.leaveMeeting },
        ])(
            'a rejoin cancelled while $step resolves cancelled and changes nothing afterwards',
            async ({ getPendingCall }) => {
                const pendingCall = createDeferred<void>();
                getPendingCall().mockReturnValueOnce(pendingCall.promise);
                const params = createParams({ mlsSetupDone: { current: true } });
                const { result } = renderHook(() => useMeetingConnection(params));

                const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
                await vi.waitFor(() => expect(getPendingCall()).toHaveBeenCalled());
                result.current.cancelReconnection();
                mockDispatch.mockClear();
                mockMeetCoreClient.leaveMeeting.mockClear();
                pendingCall.resolve();

                await expect(run).resolves.toBe('cancelled');
                expect(mockMeetCoreClient.leaveMeeting).not.toHaveBeenCalled();
                expect(params.mlsSetupDone.current).toBe(true);
                expect(params.cleanupMlsState).not.toHaveBeenCalled();
                expect(mockGetAccessDetails).not.toHaveBeenCalled();
                expect(mockDispatch).not.toHaveBeenCalled();
                expect(mockMeetCoreClient.logUserRejoin).not.toHaveBeenCalled();
            }
        );

        it('a rejoin cancelled while fetching the access token keeps the stored credentials', async () => {
            const accessDetails = createDeferred<MeetingAccessDetails>();
            mockGetAccessDetails.mockReturnValueOnce(accessDetails.promise);
            const params = createParams({ accessTokenRef: { current: 'old-token' } });
            const { result } = renderHook(() => useMeetingConnection(params));
            result.current.websocketUrlRef.current = 'wss://old';

            const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
            await vi.waitFor(() => expect(mockGetAccessDetails).toHaveBeenCalled());
            result.current.cancelReconnection();
            accessDetails.resolve({ websocketUrl: 'wss://new', accessToken: 'new-token' });

            await expect(run).resolves.toBe('cancelled');
            expect(params.accessTokenRef.current).toBe('old-token');
            expect(result.current.websocketUrlRef.current).toBe('wss://old');
            expect(params.handleMlsSetup).not.toHaveBeenCalled();
        });

        it('a rejoin cancelled while joining the MLS group does not connect to LiveKit or report anything', async () => {
            const mlsSetup = createDeferred<{ key: string; epoch: bigint }>();
            const params = createParams({ handleMlsSetup: vi.fn().mockReturnValue(mlsSetup.promise) });
            const { result } = renderHook(() => useMeetingConnection(params));

            const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
            await vi.waitFor(() => expect(params.handleMlsSetup).toHaveBeenCalled());
            result.current.cancelReconnection();
            mockDispatch.mockClear();
            mlsSetup.resolve({ key: 'group-key', epoch: 1n });

            await expect(run).resolves.toBe('cancelled');
            expect(params.connectWithStunFallbackToTurnRelay).not.toHaveBeenCalled();
            expect(params.reportMLSRelatedError).not.toHaveBeenCalled();
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockMeetCoreClient.leaveMeeting).not.toHaveBeenCalled();
            expect(params.reportMeetError).not.toHaveBeenCalled();
            expect(mockMeetCoreClient.logUserRejoin).not.toHaveBeenCalled();
        });

        it('a rejoin whose LiveKit connect fails after the cancel leaves the MLS cleanup to whoever cancelled it', async () => {
            const connect = createDeferred<unknown>();
            const params = createParams({
                connectWithStunFallbackToTurnRelay: vi.fn().mockReturnValue(connect.promise),
            });
            const { result } = renderHook(() => useMeetingConnection(params));

            const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
            await vi.waitFor(() => expect(params.connectWithStunFallbackToTurnRelay).toHaveBeenCalled());
            result.current.cancelReconnection();
            params.cleanupMlsState.mockClear();
            params.disallowHealthCheck.mockClear();
            connect.reject(new Error('Client initiated disconnect'));

            await expect(run).resolves.toBe('cancelled');
            expect(mockMeetCoreClient.leaveMeeting).not.toHaveBeenCalled();
            expect(params.cleanupMlsState).not.toHaveBeenCalled();
            expect(params.disallowHealthCheck).not.toHaveBeenCalled();
            expect(params.reportMeetError).not.toHaveBeenCalled();
        });

        it('a rejoin whose LiveKit connect succeeds after the cancel disconnects the room again', async () => {
            const connect = createDeferred<unknown>();
            const params = createParams({
                connectWithStunFallbackToTurnRelay: vi.fn().mockReturnValue(connect.promise),
            });
            const { result } = renderHook(() => useMeetingConnection(params));

            const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
            await vi.waitFor(() => expect(params.connectWithStunFallbackToTurnRelay).toHaveBeenCalled());
            result.current.cancelReconnection();
            mockRoom.disconnect.mockClear();
            connect.resolve({ stunFailed: false, connectionAttempts: 1 });

            await expect(run).resolves.toBe('cancelled');
            expect(mockRoom.disconnect).toHaveBeenCalledTimes(1);
            expect(params.getParticipants).not.toHaveBeenCalled();
            expect(mockMeetCoreClient.leaveMeeting).not.toHaveBeenCalled();
        });

        it('a cancelled rejoin whose participant fetch settles after a newer join connected leaves that room alone', async () => {
            const participants = createDeferred<void>();
            const params = createParams({ getParticipants: vi.fn().mockReturnValue(participants.promise) });
            const { result } = renderHook(() => useMeetingConnection(params));

            const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
            await vi.waitFor(() => expect(params.getParticipants).toHaveBeenCalled());
            result.current.cancelReconnection();
            mockRoom.disconnect.mockClear();
            mockRoom.state = ConnectionState.Connected;
            participants.resolve();

            await expect(run).resolves.toBe('cancelled');
            expect(mockRoom.disconnect).not.toHaveBeenCalled();
        });

        it('a rejoin cancelled during the teardown after a failure does not show the Connection lost modal', async () => {
            const teardownLeave = createDeferred<void>();
            mockMeetCoreClient.leaveMeeting.mockReturnValueOnce(teardownLeave.promise);
            const params = createParams({ getParticipants: vi.fn().mockRejectedValue(new Error('unavailable')) });
            params.handleMlsSetup.mockImplementation(async () => {
                params.mlsSetupDone.current = true;
                return { key: 'group-key', epoch: 1n };
            });
            const { result } = renderHook(() => useMeetingConnection(params));

            const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
            await vi.waitFor(() => expect(mockMeetCoreClient.leaveMeeting).toHaveBeenCalled());
            expect(result.current.isReconnectingRef.current).toBe(true);
            result.current.cancelReconnection();
            mockDispatch.mockClear();
            mockRoom.disconnect.mockClear();
            mockRoom.state = ConnectionState.Connected;
            teardownLeave.resolve();

            await expect(run).resolves.toBe('cancelled');
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockMeetCoreClient.logUserRejoin).not.toHaveBeenCalled();
            expect(mockRoom.disconnect).not.toHaveBeenCalled();
        });

        it('ends the rejoin synchronously, and does nothing again or when no rejoin runs', async () => {
            const params = createParams();
            const { result } = renderHook(() => useMeetingConnection(params));

            result.current.cancelReconnection();
            expect(mockDispatch).not.toHaveBeenCalled();

            const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
            mockDispatch.mockClear();
            result.current.cancelReconnection();

            expect(result.current.isReconnectingRef.current).toBe(false);
            expect(mockDispatch).toHaveBeenCalledTimes(1);
            expect(mockDispatch).toHaveBeenCalledWith(setIsReconnecting(false));

            result.current.cancelReconnection();
            expect(mockDispatch).toHaveBeenCalledTimes(1);
            await expect(run).resolves.toBe('cancelled');
        });

        it('unmounting stops a running rejoin', async () => {
            const params = createParams();
            const { result, unmount } = renderHook(() => useMeetingConnection(params));

            const run = result.current.performFullReconnection(RejoinReasonInfo.Other);
            mockDispatch.mockClear();
            unmount();

            await expect(run).resolves.toBe('cancelled');
            expect(mockGetAccessDetails).not.toHaveBeenCalled();
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockMeetCoreClient.logUserRejoin).not.toHaveBeenCalled();
        });

        it('a trigger after a cancel starts a new rejoin, and the cancelled one stays silent', async () => {
            const firstMlsSetup = createDeferred<{ key: string; epoch: bigint }>();
            const params = createParams({
                handleMlsSetup: vi
                    .fn()
                    .mockReturnValueOnce(firstMlsSetup.promise)
                    .mockResolvedValue({ key: 'group-key', epoch: 1n }),
            });
            const { result } = renderHook(() => useMeetingConnection(params));

            const cancelledRun = result.current.performFullReconnection(RejoinReasonInfo.Other);
            await vi.waitFor(() => expect(params.handleMlsSetup).toHaveBeenCalled());
            result.current.cancelReconnection();

            await expect(result.current.performFullReconnection(RejoinReasonInfo.Other)).resolves.toBe('joined');
            mockDispatch.mockClear();
            firstMlsSetup.resolve({ key: 'group-key', epoch: 1n });

            await expect(cancelledRun).resolves.toBe('cancelled');
            expect(params.connectWithStunFallbackToTurnRelay).toHaveBeenCalledTimes(1);
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(result.current.isReconnectingRef.current).toBe(false);
        });
    });
});
