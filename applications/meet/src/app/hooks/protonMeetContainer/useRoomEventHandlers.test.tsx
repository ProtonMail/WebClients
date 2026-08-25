import { useHistory } from 'react-router-dom';

import { useRoomContext } from '@livekit/components-react';
import { RejoinReasonInfo } from '@proton-meet/proton-meet-core';
import { act, renderHook } from '@testing-library/react';
import { ConnectionState, DisconnectReason, RoomEvent } from 'livekit-client';
import type { Mock } from 'vitest';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setIsReconnecting, setJoinedRoom } from '@proton/meet/store/slices/connectionSlice';
import { setUpsellModalType } from '@proton/meet/store/slices/meetAppStateSlice';
import { UpsellModalTypes } from '@proton/meet/types/types';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { useRoomEventHandlers } from './useRoomEventHandlers';

vi.mock('@livekit/components-react', () => ({ useRoomContext: vi.fn() }));
vi.mock('react-router-dom', () => ({ useHistory: vi.fn() }));
vi.mock('@proton/meet/store/hooks', () => ({ useMeetDispatch: vi.fn() }));
vi.mock('../../contexts/MeetCoreClientContext', () => ({ useMeetCoreClient: vi.fn() }));

const useRoomContextMock = useRoomContext as unknown as Mock;
const useHistoryMock = useHistory as unknown as Mock;
const useMeetDispatchMock = useMeetDispatch as unknown as Mock;
const useMeetCoreClientMock = useMeetCoreClient as unknown as Mock;

const mockRoom = { on: vi.fn(), off: vi.fn() };
const mockHistory = { push: vi.fn() };
const mockDispatch = vi.fn();
const mockMeetCoreClient = { leaveMeeting: vi.fn().mockResolvedValue(undefined) };

const createParams = (overrides: Record<string, any> = {}) => ({
    joinedRoom: true,
    disallowHealthCheck: vi.fn(),
    cleanupMlsState: vi.fn(),
    stopPiP: vi.fn().mockResolvedValue(undefined),
    joinedRoomLoggedRef: { current: true },
    instantMeetingRef: { current: true },
    mlsSetupDone: { current: true },
    isReconnectingRef: { current: false },
    isExpiringRef: { current: false },
    meetingLinkRef: { current: 'https://meet/link' },
    meetingLinkNameRef: { current: 'meeting-abc' },
    triggerFullReconnectionRef: { current: vi.fn() },
    reportMeetError: vi.fn(),
    ...overrides,
});

const getHandler = (event: RoomEvent): ((arg?: any) => void) => {
    const call = mockRoom.on.mock.calls.find(([registeredEvent]) => registeredEvent === event);
    return call?.[1];
};

describe('useRoomEventHandlers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useRoomContextMock.mockReturnValue(mockRoom);
        useHistoryMock.mockReturnValue(mockHistory);
        useMeetDispatchMock.mockReturnValue(mockDispatch);
        useMeetCoreClientMock.mockReturnValue(mockMeetCoreClient);
    });

    it('does not register listeners while not joined', () => {
        renderHook(() => useRoomEventHandlers(createParams({ joinedRoom: false })));

        expect(mockRoom.on).not.toHaveBeenCalled();
    });

    it('registers listeners while joined and removes them on cleanup', () => {
        const { unmount } = renderHook(() => useRoomEventHandlers(createParams()));

        expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.ConnectionStateChanged, expect.any(Function));
        expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.Disconnected, expect.any(Function));

        unmount();

        expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.Disconnected, expect.any(Function));
        expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.ConnectionStateChanged, expect.any(Function));
    });

    describe('Disconnected handler', () => {
        it('treats STATE_MISMATCH as recoverable and triggers reconnection without leaving the meeting', () => {
            const params = createParams();
            renderHook(() => useRoomEventHandlers(params));

            act(() => getHandler(RoomEvent.Disconnected)(DisconnectReason.STATE_MISMATCH));

            expect(params.disallowHealthCheck).toHaveBeenCalledTimes(1);
            expect(mockDispatch).toHaveBeenCalledWith(setIsReconnecting(true));
            expect(mockDispatch).toHaveBeenCalledWith(setJoinedRoom(false));
            expect(params.cleanupMlsState).toHaveBeenCalledTimes(1);
            expect(params.triggerFullReconnectionRef.current).toHaveBeenCalledWith(
                RejoinReasonInfo.LivekitStateMismatch
            );
            expect(mockMeetCoreClient.leaveMeeting).not.toHaveBeenCalled();
        });

        it('on ROOM_DELETED cleans up, sets the meeting-ended upsell and navigates to the dashboard', () => {
            const params = createParams();
            renderHook(() => useRoomEventHandlers(params));

            act(() => getHandler(RoomEvent.Disconnected)(DisconnectReason.ROOM_DELETED));

            expect(mockMeetCoreClient.leaveMeeting).toHaveBeenCalledTimes(1);
            expect(params.cleanupMlsState).toHaveBeenCalledTimes(1);
            expect(mockDispatch).toHaveBeenCalledWith(setUpsellModalType(UpsellModalTypes.MeetingEnded));
            expect(mockHistory.push).toHaveBeenCalledWith('/dashboard');
            expect(params.meetingLinkNameRef.current).toBe('');
        });

        it('on PARTICIPANT_REMOVED sets the removed upsell and navigates', () => {
            const params = createParams();
            renderHook(() => useRoomEventHandlers(params));

            act(() => getHandler(RoomEvent.Disconnected)(DisconnectReason.PARTICIPANT_REMOVED));

            expect(mockDispatch).toHaveBeenCalledWith(setUpsellModalType(UpsellModalTypes.RemovedFromMeeting));
            expect(mockHistory.push).toHaveBeenCalledWith('/dashboard');
        });

        it('reports an abnormal disconnect without navigating', () => {
            const params = createParams();
            renderHook(() => useRoomEventHandlers(params));

            act(() => getHandler(RoomEvent.Disconnected)(DisconnectReason.SERVER_SHUTDOWN));

            expect(params.reportMeetError).toHaveBeenCalledWith('Room disconnected unexpectedly', expect.anything());
            expect(mockHistory.push).not.toHaveBeenCalled();
        });

        it('skips leaveMeeting while a full reconnection is active', () => {
            const params = createParams({ isReconnectingRef: { current: true } });
            renderHook(() => useRoomEventHandlers(params));

            act(() => getHandler(RoomEvent.Disconnected)(DisconnectReason.CLIENT_INITIATED));

            expect(mockMeetCoreClient.leaveMeeting).not.toHaveBeenCalled();
        });

        it('does not set the meeting-ended upsell when the meeting is expiring', () => {
            const params = createParams({ isExpiringRef: { current: true } });
            renderHook(() => useRoomEventHandlers(params));

            act(() => getHandler(RoomEvent.Disconnected)(DisconnectReason.ROOM_DELETED));

            expect(mockDispatch).not.toHaveBeenCalledWith(setUpsellModalType(UpsellModalTypes.MeetingEnded));
            expect(params.isExpiringRef.current).toBe(false);
            expect(mockHistory.push).toHaveBeenCalledWith('/dashboard');
        });
    });

    describe('ConnectionStateChanged handler', () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        it('shows the reconnected message when transitioning back to Connected', () => {
            const { result } = renderHook(() => useRoomEventHandlers(createParams()));
            const handler = getHandler(RoomEvent.ConnectionStateChanged);

            act(() => handler(ConnectionState.Reconnecting));
            act(() => handler(ConnectionState.Connected));

            expect(result.current.showReconnectedMessage).toBe(true);
        });

        it('does not show the reconnected message on the initial connect', () => {
            const { result } = renderHook(() => useRoomEventHandlers(createParams()));
            const handler = getHandler(RoomEvent.ConnectionStateChanged);

            act(() => handler(ConnectionState.Connected));

            expect(result.current.showReconnectedMessage).toBe(false);
        });
    });
});
