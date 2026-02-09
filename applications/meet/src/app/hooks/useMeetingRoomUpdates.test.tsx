import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';

import { meetingStateReducer } from '@proton/meet/store/slices/meetingState';
import type { MeetChatMessage, ParticipantEventRecord } from '@proton/meet/types/types';
import { ParticipantEvent } from '@proton/meet/types/types';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { MeetContext } from '../contexts/MeetContext';
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

const mockParticipantNameMap = {
    test: 'test',
};

const createMockStore = () => {
    return configureStore({
        reducer: {
            ...meetingStateReducer,
        },
        preloadedState: {
            meetingState: {
                page: 0,
                pageSize: 12,
                chatMessages: mockChatMessages,
                events: mockParticipantEvents,
            },
        },
    });
};

describe('useMeetingRoomUpdates', () => {
    it('should return the combined data of participant events and chat messages', () => {
        const store = createMockStore();

        const { result } = renderHook(() => useMeetingRoomUpdates(), {
            wrapper: ({ children }) => (
                <Provider context={ProtonStoreContext} store={store}>
                    <MeetContext.Provider
                        // @ts-expect-error - mock data
                        value={{
                            participantNameMap: mockParticipantNameMap,
                        }}
                    >
                        {children}
                    </MeetContext.Provider>
                </Provider>
            ),
        });

        expect(result.current).toEqual([
            ...mockParticipantEvents.map((item) => ({ ...item, type: 'event' as const, name: 'test' })),
            ...mockChatMessages.map((item) => ({ ...item, type: 'message' as const, name: 'test' })),
        ]);
    });
});
