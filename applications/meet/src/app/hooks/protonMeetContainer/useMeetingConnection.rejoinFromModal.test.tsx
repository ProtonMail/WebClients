import { useHistory } from 'react-router-dom';

import { useRoomContext } from '@livekit/components-react';
import { RejoinReasonInfo } from '@proton-meet/proton-meet-core';
import { act, renderHook } from '@testing-library/react';
import { DisconnectReason, RoomEvent } from 'livekit-client';
import type { Mock } from 'vitest';

import { useMeetDispatch, useMeetStore } from '@proton/meet/store/hooks';
import { setJoinedRoom, setReconnectionFailed } from '@proton/meet/store/slices/connectionSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { useMeetingAuthentication } from '../srp/useMeetingAuthentication';
import { useMeetingConnection } from './useMeetingConnection';
import { useRoomEventHandlers } from './useRoomEventHandlers';

vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
    useLocalParticipant: () => ({ isCameraEnabled: false, isMicrophoneEnabled: false }),
}));
vi.mock('react-router-dom', () => ({ useHistory: vi.fn() }));
vi.mock('@proton/meet/store/hooks', () => ({ useMeetDispatch: vi.fn(), useMeetStore: vi.fn() }));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: vi.fn() }));
vi.mock('../../contexts/MeetCoreClientContext', () => ({ useMeetCoreClient: vi.fn() }));
vi.mock('../srp/useMeetingAuthentication', () => ({ useMeetingAuthentication: vi.fn() }));

const mockDispatch = vi.fn();
const mockGetAccessDetails = vi.fn();
const mockHandleMlsSetup = vi.fn();
const mockMeetCoreClient = {
    leaveMeeting: vi.fn().mockResolvedValue(undefined),
    logUserRejoin: vi.fn().mockResolvedValue(undefined),
};

const createRoomThatEmitsOnDisconnect = () => {
    const disconnectedListeners = new Set<(reason?: DisconnectReason) => void>();
    const emitDisconnected = (reason?: DisconnectReason) => {
        disconnectedListeners.forEach((listener) => listener(reason));
    };

    return {
        localParticipant: { isCameraEnabled: false, isMicrophoneEnabled: false },
        setE2EEEnabled: vi.fn().mockResolvedValue(undefined),
        on: vi.fn((event: RoomEvent, listener: (reason?: DisconnectReason) => void) => {
            if (event === RoomEvent.Disconnected) {
                disconnectedListeners.add(listener);
            }
        }),
        off: vi.fn((_event: RoomEvent, listener: (reason?: DisconnectReason) => void) => {
            disconnectedListeners.delete(listener);
        }),
        disconnect: vi.fn(async () => emitDisconnected(DisconnectReason.CLIENT_INITIATED)),
        emitDisconnected,
    };
};

const renderConnectionWithRoomEventHandlers = (getParticipants: Mock) => {
    const meetingLinkNameRef = { current: 'meeting-abc' };
    const mlsSetupDone = { current: true };
    const triggerFullReconnectionRef = { current: vi.fn() };
    const cleanupMlsState = vi.fn(() => {
        mlsSetupDone.current = false;
    });
    const disallowHealthCheck = vi.fn();
    const reportMeetError = vi.fn();

    const rendered = renderHook(() => {
        const connection = useMeetingConnection({
            meetingLinkNameRef,
            meetingPassword: 'pw',
            displayName: 'Alice',
            decryptionKeyRef: { current: null },
            mlsSetupDone,
            accessTokenRef: { current: null },
            keyProvider: { setKeyWithEpoch: vi.fn().mockResolvedValue(undefined) } as any,
            keyRotationScheduler: { schedule: vi.fn().mockResolvedValue(undefined) } as any,
            handleMlsSetup: mockHandleMlsSetup,
            reportMLSRelatedError: vi.fn(),
            connectWithStunFallbackToTurnRelay: vi.fn().mockResolvedValue({ stunFailed: false, connectionAttempts: 1 }),
            cleanupMlsState,
            allowHealthCheck: vi.fn(),
            disallowHealthCheck,
            initializeDevices: vi.fn().mockResolvedValue(undefined),
            getParticipants,
            getQueryParticipantsCount: vi.fn().mockResolvedValue(undefined),
            reportMeetError,
            triggerFullReconnectionRef,
        });

        useRoomEventHandlers({
            joinedRoom: true,
            disallowHealthCheck,
            cleanupMlsState,
            stopPiP: vi.fn().mockResolvedValue(undefined),
            joinedRoomLoggedRef: { current: true },
            instantMeetingRef: { current: false },
            mlsSetupDone,
            isReconnectingRef: connection.isReconnectingRef,
            isExpiringRef: { current: false },
            meetingLinkRef: { current: 'https://meet/link' },
            meetingLinkNameRef,
            triggerFullReconnectionRef,
            cancelReconnection: connection.cancelReconnection,
            reportMeetError,
        });

        return connection;
    });

    return { ...rendered, triggerFullReconnectionRef, mlsSetupDone };
};

let room: ReturnType<typeof createRoomThatEmitsOnDisconnect>;

beforeEach(() => {
    vi.clearAllMocks();
    room = createRoomThatEmitsOnDisconnect();
    (useRoomContext as unknown as Mock).mockReturnValue(room);
    (useHistory as unknown as Mock).mockReturnValue({ push: vi.fn() });
    (useMeetDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (useMeetStore as unknown as Mock).mockReturnValue({ getState: vi.fn() });
    (useFlag as unknown as Mock).mockReturnValue(false);
    (useMeetCoreClient as unknown as Mock).mockReturnValue(mockMeetCoreClient);
    (useMeetingAuthentication as unknown as Mock).mockReturnValue({ getAccessDetails: mockGetAccessDetails });
    mockGetAccessDetails.mockResolvedValue({ websocketUrl: 'wss://x', accessToken: 'tok' });
    mockHandleMlsSetup.mockResolvedValue({ key: 'group-key', epoch: 1n });
});

describe('rejoining from the Connection lost modal', () => {
    it('rejoins after a rejoin that failed once the room had connected', async () => {
        const getParticipants = vi
            .fn()
            .mockRejectedValueOnce(new Error('participants unavailable'))
            .mockResolvedValue(undefined);
        const { result } = renderConnectionWithRoomEventHandlers(getParticipants);

        let failedRunStatus;
        await act(async () => {
            failedRunStatus = await result.current.performFullReconnection(RejoinReasonInfo.Other);
        });

        expect(failedRunStatus).toBe('failed');
        expect(mockDispatch).toHaveBeenCalledWith(setReconnectionFailed(true));

        let modalRunStatus;
        await act(async () => {
            modalRunStatus = await result.current.performFullReconnection(RejoinReasonInfo.Other);
        });

        expect(modalRunStatus).toBe('joined');
        expect(room.disconnect).toHaveBeenCalledTimes(2);
        expect(mockGetAccessDetails).toHaveBeenCalledTimes(2);
        expect(getParticipants).toHaveBeenCalledTimes(2);
        expect(mockDispatch).toHaveBeenCalledWith(setJoinedRoom(true));
    });
});

describe('rejoining after an unexpected LiveKit disconnect', () => {
    beforeEach(() => {
        (useFlag as unknown as Mock).mockImplementation((flag: string) => flag === 'MeetHandleStalledLiveKitReconnect');
    });

    it.each([
        ['no reason', undefined],
        ['SERVER_SHUTDOWN', DisconnectReason.SERVER_SHUTDOWN],
    ])('leaves meet-core before joining MLS again after a disconnect with %s', async (_name, reason) => {
        const { triggerFullReconnectionRef } = renderConnectionWithRoomEventHandlers(
            vi.fn().mockResolvedValue(undefined)
        );
        const performFullReconnection = vi.spyOn(triggerFullReconnectionRef, 'current');

        await act(async () => {
            room.emitDisconnected(reason);
            await expect(performFullReconnection.mock.results[0]?.value).resolves.toBe('joined');
        });

        expect(mockMeetCoreClient.leaveMeeting).toHaveBeenCalledTimes(1);
        expect(mockHandleMlsSetup).toHaveBeenCalledTimes(1);
        expect(mockMeetCoreClient.leaveMeeting.mock.invocationCallOrder[0]).toBeLessThan(
            mockHandleMlsSetup.mock.invocationCallOrder[0]
        );
    });

    it('stops rejoining after three disconnects in a row, leaves meet-core and shows the Connection lost modal', async () => {
        const { triggerFullReconnectionRef, mlsSetupDone } = renderConnectionWithRoomEventHandlers(
            vi.fn().mockResolvedValue(undefined)
        );
        mockHandleMlsSetup.mockImplementation(async () => {
            mlsSetupDone.current = true;
            return { key: 'group-key', epoch: 1n };
        });
        const performFullReconnection = vi.spyOn(triggerFullReconnectionRef, 'current');
        const { emitDisconnected } = room;

        for (const expectedStatus of ['joined', 'joined', 'joined', 'failed']) {
            await act(async () => {
                emitDisconnected(undefined);
                await expect(performFullReconnection.mock.results.at(-1)?.value).resolves.toBe(expectedStatus);
            });
        }

        expect(mockHandleMlsSetup).toHaveBeenCalledTimes(3);
        expect(room.disconnect).toHaveBeenCalledTimes(4);
        expect(mockMeetCoreClient.leaveMeeting).toHaveBeenCalledTimes(4);
        expect(mockMeetCoreClient.leaveMeeting.mock.invocationCallOrder[3]).toBeGreaterThan(
            mockHandleMlsSetup.mock.invocationCallOrder[2]
        );
        expect(mockDispatch).toHaveBeenCalledWith(setReconnectionFailed(true));
    });
});
