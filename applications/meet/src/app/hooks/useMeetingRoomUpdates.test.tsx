import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';

import { chatAndReactionsReducer } from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    initialState as initialParticipantsState,
    participantsReducer,
} from '@proton/meet/store/slices/participants/participantsSlice';
import {
    initialState as initialSortedParticipantsState,
    sortedParticipantsReducer,
} from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import type { MeetChatMessage, ParticipantEventRecord } from '@proton/meet/types/types';
import { ParticipantEvent } from '@proton/meet/types/types';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { useMeetingRoomUpdates } from './useMeetingRoomUpdates';

const mockParticipantEvents: ParticipantEventRecord[] = [
    {
        timestamp: 1718534400,
        identity: 'test',
        eventType: ParticipantEvent.Join,
    },
];
const mockChatMessages: MeetChatMessage[] = [
    {
        timestamp: 1718534400,
        identity: 'test',
        message: 'test',
        id: 'test',
    },
];

const mockParticipantMap = {
    test: {
        ParticipantUUID: 'test',
        EncryptedDisplayName: 'encrypted-test',
    },
};

const mockParticipantNameMap = {
    test: 'test',
};

const createMockStore = (overrides?: { chatMessages?: MeetChatMessage[]; events?: ParticipantEventRecord[] }) => {
    return configureStore({
        reducer: {
            ...sortedParticipantsReducer,
            ...chatAndReactionsReducer,
            ...participantsReducer,
        },
        preloadedState: {
            sortedParticipants: {
                ...initialSortedParticipantsState,
                pageSize: 12,
            },
            meetingChatAndReactions: {
                draftMessage: '',
                chatMessages: overrides?.chatMessages ?? mockChatMessages,
                events: overrides?.events ?? mockParticipantEvents,
                raisedHands: [],
                activeReactions: {},
                reactionEventIndex: {},
            },
            participants: {
                ...initialParticipantsState,
                participantsMap: mockParticipantMap,
                participantDecryptedNameMap: mockParticipantNameMap,
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

describe('useMeetingRoomUpdates', () => {
    it('should return the combined data of participant events and chat messages', () => {
        const store = createMockStore();

        const { result } = renderHook(() => useMeetingRoomUpdates(), {
            wrapper: createTestWrapper(store),
        });

        expect(result.current).toEqual([
            ...mockParticipantEvents.map((item) => ({ ...item, type: 'event' as const, name: 'test' })),
            ...mockChatMessages.map((item) => ({ ...item, type: 'message' as const, name: 'test' })),
        ]);
    });
});
