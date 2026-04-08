import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';

import { chatAndReactionsReducer } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { initialState as initialMeetingInfoState, meetingInfoReducer } from '@proton/meet/store/slices/meetingInfo';
import {
    initialState as initialSortedParticipantsState,
    sortedParticipantsReducer,
} from '@proton/meet/store/slices/sortedParticipantsSlice';
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
        DisplayName: 'test',
    },
};

const createMockStore = (overrides?: { chatMessages?: MeetChatMessage[]; events?: ParticipantEventRecord[] }) => {
    return configureStore({
        reducer: {
            ...sortedParticipantsReducer,
            ...chatAndReactionsReducer,
            ...meetingInfoReducer,
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
            },
            meetingInfo: {
                ...initialMeetingInfoState,
                participantsMap: mockParticipantMap,
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
