import { Provider } from 'react-redux';

import { useRoomContext } from '@livekit/components-react';
import { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { connectionReducer, initialState as initialConnectionState } from '@proton/meet/store/slices/connectionSlice';
import {
    initialState as initialParticipantsState,
    participantsReducer,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { MeetCoreRestartedError } from '../../wasm/meetCoreStallRecovery';
import { useMeetingCleanup } from './useMeetingCleanup';

vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
}));

vi.mock('../../contexts/MeetCoreClientContext', () => ({
    useMeetCoreClient: vi.fn(),
}));

const reportMeetError = vi.fn();
vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError }),
}));

const useRoomContextMock = useRoomContext as unknown as Mock;
const useMeetCoreClientMock = useMeetCoreClient as unknown as Mock;

const mockRoom = {
    disconnect: vi.fn().mockResolvedValue(undefined),
};

const mockMeetCoreClient = {
    leaveMeeting: vi.fn().mockResolvedValue(undefined),
};

const mockParticipantMap = {
    test: {
        ParticipantUUID: 'test',
        EncryptedDisplayName: 'encrypted-test',
    },
};

const createMockStore = () => {
    return configureStore({
        reducer: {
            ...participantsReducer,
            ...connectionReducer,
        },
        preloadedState: {
            participants: {
                ...initialParticipantsState,
                participantsMap: mockParticipantMap,
                participantDecryptedNameMap: { test: 'test' },
                isFetchingParticipants: true,
            },
            connection: {
                ...initialConnectionState,
                joinedRoom: true,
            },
        },
    });
};

function createTestWrapper(store: ReturnType<typeof createMockStore>) {
    function TestWrapper({ children }: { children: React.ReactNode }) {
        return (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        );
    }
    return TestWrapper;
}

const createParams = () => ({
    instantMeetingRef: { current: true },
    meetingLinkNameRef: { current: 'meeting-abc' },
    decryptionKeyRef: { current: {} as unknown as CryptoKey },
    disallowHealthCheck: vi.fn(),
    cleanupMlsState: vi.fn(),
    stopPiP: vi.fn().mockResolvedValue(undefined),
    cancelReconnection: vi.fn(),
});

describe('useMeetingCleanup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRoom.disconnect.mockResolvedValue(undefined);
        mockMeetCoreClient.leaveMeeting.mockResolvedValue(undefined);
        useRoomContextMock.mockReturnValue(mockRoom);
        useMeetCoreClientMock.mockReturnValue(mockMeetCoreClient);
    });

    it('resets meeting state without disconnecting when disconnect is not requested', () => {
        const store = createMockStore();
        const params = createParams();
        const { result } = renderHook(() => useMeetingCleanup(params), {
            wrapper: createTestWrapper(store),
        });

        result.current.cleanupMeeting();

        expect(params.instantMeetingRef.current).toBe(false);
        expect(params.meetingLinkNameRef.current).toBe('');
        expect(params.decryptionKeyRef.current).toBeNull();

        const { participants, connection } = store.getState();
        expect(participants.participantsMap).toEqual({});
        expect(participants.participantDecryptedNameMap).toEqual({});
        expect(participants.isFetchingParticipants).toBe(false);
        expect(connection.joinedRoom).toBe(false);

        expect(params.disallowHealthCheck).toHaveBeenCalledTimes(1);
        expect(params.cleanupMlsState).toHaveBeenCalledTimes(1);

        expect(mockRoom.disconnect).not.toHaveBeenCalled();
        expect(mockMeetCoreClient.leaveMeeting).not.toHaveBeenCalled();
        expect(params.stopPiP).not.toHaveBeenCalled();
    });

    it('disconnects the room, leaves the meeting and stops PiP when disconnect is requested', () => {
        const store = createMockStore();
        const params = createParams();
        const { result } = renderHook(() => useMeetingCleanup(params), {
            wrapper: createTestWrapper(store),
        });

        result.current.cleanupMeeting({ disconnect: true });

        expect(mockRoom.disconnect).toHaveBeenCalledTimes(1);
        expect(mockMeetCoreClient.leaveMeeting).toHaveBeenCalledTimes(1);
        expect(params.stopPiP).toHaveBeenCalledTimes(1);

        expect(store.getState().connection.joinedRoom).toBe(false);
        expect(params.meetingLinkNameRef.current).toBe('');
    });

    it('reports a failed leave instead of leaving it unhandled', async () => {
        const error = new Error('Meet core worker client is not available');
        mockMeetCoreClient.leaveMeeting.mockRejectedValue(error);
        const { result } = renderHook(() => useMeetingCleanup(createParams()), {
            wrapper: createTestWrapper(createMockStore()),
        });

        result.current.cleanupMeeting({ disconnect: true });

        await vi.waitFor(() =>
            expect(reportMeetError).toHaveBeenCalledWith('Failed to leave meeting', { context: { error } })
        );
    });

    it('reports nothing when meet-core no longer has the participant to remove', async () => {
        mockMeetCoreClient.leaveMeeting.mockRejectedValue(MeetCoreErrorEnum.ParticipantNotFound);
        const { result } = renderHook(() => useMeetingCleanup(createParams()), {
            wrapper: createTestWrapper(createMockStore()),
        });

        result.current.cleanupMeeting({ disconnect: true });

        await expect(mockMeetCoreClient.leaveMeeting.mock.results[0].value).rejects.toBe(
            MeetCoreErrorEnum.ParticipantNotFound
        );
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('reports nothing when a meet-core restart dropped the leave', async () => {
        const error = new MeetCoreRestartedError();
        mockMeetCoreClient.leaveMeeting.mockRejectedValue(error);
        const { result } = renderHook(() => useMeetingCleanup(createParams()), {
            wrapper: createTestWrapper(createMockStore()),
        });

        result.current.cleanupMeeting({ disconnect: true });

        await expect(mockMeetCoreClient.leaveMeeting.mock.results[0].value).rejects.toBe(error);
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('still reports any other meet-core failure to leave', async () => {
        mockMeetCoreClient.leaveMeeting.mockRejectedValue(MeetCoreErrorEnum.HttpClientError);
        const { result } = renderHook(() => useMeetingCleanup(createParams()), {
            wrapper: createTestWrapper(createMockStore()),
        });

        result.current.cleanupMeeting({ disconnect: true });

        await vi.waitFor(() =>
            expect(reportMeetError).toHaveBeenCalledWith('Failed to leave meeting', {
                context: { error: MeetCoreErrorEnum.HttpClientError },
            })
        );
    });

    it('cancels a running rejoin before it forgets the meeting', () => {
        const store = createMockStore();
        const params = createParams();
        const meetingLinkNamesWhenCancelled: string[] = [];
        params.cancelReconnection.mockImplementation(() => {
            meetingLinkNamesWhenCancelled.push(params.meetingLinkNameRef.current);
        });
        const { result } = renderHook(() => useMeetingCleanup(params), {
            wrapper: createTestWrapper(store),
        });

        result.current.cleanupMeeting({ disconnect: true });

        expect(meetingLinkNamesWhenCancelled).toEqual(['meeting-abc']);
        expect(params.meetingLinkNameRef.current).toBe('');
    });
});
