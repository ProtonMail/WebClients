import { renderHook } from '@testing-library/react';

import { MeetContext } from '../contexts/MeetContext';
import type { MeetChatMessage, ParticipantEventRecord } from '../types';
import { ParticipantEvent } from '../types';
import { useMeetingRoomUpdates } from './useMeetingRoomUpdates';

const mockParticipantEvents: ParticipantEventRecord[] = [
    {
        timestamp: 1718534400,
        identity: 'test',
        name: 'test',
        eventType: ParticipantEvent.Join,
    },
];
const mockChatMessages: MeetChatMessage[] = [
    {
        timestamp: 1718534400,
        identity: 'test',
        name: 'test',
        message: 'test',
        id: 'test',
    },
];

describe('useMeetingRoomUpdates', () => {
    it('should return the combined data of participant events and chat messages', () => {
        const { result } = renderHook(() => useMeetingRoomUpdates(), {
            wrapper: ({ children }) => (
                <MeetContext.Provider
                    // @ts-expect-error - mock data
                    value={{
                        participantEvents: mockParticipantEvents,
                        chatMessages: mockChatMessages,
                    }}
                >
                    {children}
                </MeetContext.Provider>
            ),
        });

        expect(result.current).toEqual([
            ...mockParticipantEvents.map((item) => ({ ...item, type: 'event' as const })),
            ...mockChatMessages.map((item) => ({ ...item, type: 'message' as const })),
        ]);
    });
});
