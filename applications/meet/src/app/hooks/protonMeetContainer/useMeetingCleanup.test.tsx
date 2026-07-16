import { useRoomContext } from '@livekit/components-react';
import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { resetParticipantMaps } from '@proton/meet/store/slices';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { useMeetingCleanup } from './useMeetingCleanup';

vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
}));

vi.mock('../../contexts/MeetCoreClientContext', () => ({
    useMeetCoreClient: vi.fn(),
}));

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetDispatch: vi.fn(),
}));

vi.mock('@proton/meet/store/slices', () => ({
    resetParticipantMaps: vi.fn(),
}));

const useRoomContextMock = useRoomContext as unknown as Mock;
const useMeetCoreClientMock = useMeetCoreClient as unknown as Mock;
const useMeetDispatchMock = useMeetDispatch as unknown as Mock;
const resetParticipantMapsMock = resetParticipantMaps as unknown as Mock;

const dispatch = vi.fn();
const resetParticipantMapsAction = { type: 'meetingInfo/resetParticipantMaps' };

const mockRoom = {
    disconnect: vi.fn().mockResolvedValue(undefined),
};

const mockMeetCoreClient = {
    leaveMeeting: vi.fn().mockResolvedValue(undefined),
};

const createParams = () => ({
    instantMeetingRef: { current: true },
    meetingLinkNameRef: { current: 'meeting-abc' },
    meetingInfoRef: { current: { some: 'info' } as any },
    decryptionKeyRef: { current: {} as unknown as CryptoKey },
    disallowHealthCheck: vi.fn(),
    cleanupMlsState: vi.fn(),
    stopPiP: vi.fn().mockResolvedValue(undefined),
    setJoinedRoom: vi.fn(),
});

describe('useMeetingCleanup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRoom.disconnect.mockResolvedValue(undefined);
        mockMeetCoreClient.leaveMeeting.mockResolvedValue(undefined);
        useRoomContextMock.mockReturnValue(mockRoom);
        useMeetCoreClientMock.mockReturnValue(mockMeetCoreClient);
        useMeetDispatchMock.mockReturnValue(dispatch);
        resetParticipantMapsMock.mockReturnValue(resetParticipantMapsAction);
    });

    it('resets meeting state without disconnecting when disconnect is not requested', () => {
        const params = createParams();
        const { result } = renderHook(() => useMeetingCleanup(params));

        result.current.cleanupMeeting();

        expect(params.instantMeetingRef.current).toBe(false);
        expect(params.meetingLinkNameRef.current).toBe('');
        expect(params.meetingInfoRef.current).toBeNull();
        expect(params.decryptionKeyRef.current).toBeNull();
        expect(dispatch).toHaveBeenCalledWith(resetParticipantMapsAction);
        expect(params.disallowHealthCheck).toHaveBeenCalledTimes(1);
        expect(params.cleanupMlsState).toHaveBeenCalledTimes(1);
        expect(params.setJoinedRoom).toHaveBeenCalledWith(false);

        expect(mockRoom.disconnect).not.toHaveBeenCalled();
        expect(mockMeetCoreClient.leaveMeeting).not.toHaveBeenCalled();
        expect(params.stopPiP).not.toHaveBeenCalled();
    });

    it('disconnects the room, leaves the meeting and stops PiP when disconnect is requested', () => {
        const params = createParams();
        const { result } = renderHook(() => useMeetingCleanup(params));

        result.current.cleanupMeeting({ disconnect: true });

        expect(mockRoom.disconnect).toHaveBeenCalledTimes(1);
        expect(mockMeetCoreClient.leaveMeeting).toHaveBeenCalledTimes(1);
        expect(params.stopPiP).toHaveBeenCalledTimes(1);

        expect(params.setJoinedRoom).toHaveBeenCalledWith(false);
        expect(params.meetingLinkNameRef.current).toBe('');
    });
});
