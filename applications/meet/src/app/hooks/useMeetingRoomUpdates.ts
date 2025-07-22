import { useMemo } from 'react';

import { useMeetContext } from '../contexts/MeetContext';
import type { MeetChatMessage, ParticipantEventRecord } from '../types';

export const useMeetingRoomUpdates = (): (MeetChatMessage | ParticipantEventRecord)[] => {
    const { participantEvents, chatMessages } = useMeetContext();

    const combinedData = useMemo(() => {
        return [
            ...participantEvents.map((event) => ({ ...event, type: 'event' as const })),
            ...chatMessages.map((message) => ({ ...message, type: 'message' as const })),
        ].sort((a, b) => a.timestamp - b.timestamp);
    }, [participantEvents, chatMessages]);

    return combinedData;
};
