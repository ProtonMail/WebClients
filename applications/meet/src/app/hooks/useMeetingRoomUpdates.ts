import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectChatMessages, selectEvents } from '@proton/meet/store/slices/meetingState';
import type { MeetChatMessage, ParticipantEventRecord } from '@proton/meet/types/types';

import { useMeetContext } from '../contexts/MeetContext';

export const useMeetingRoomUpdates = (): (MeetChatMessage | ParticipantEventRecord)[] => {
    const participantEvents = useMeetSelector(selectEvents);
    const chatMessages = useMeetSelector(selectChatMessages);

    const { participantNameMap } = useMeetContext();

    const combinedData = [
        ...participantEvents.map((event) => ({
            ...event,
            type: 'event' as const,
            name: participantNameMap?.[event.identity],
        })),
        ...chatMessages.map((message) => ({
            ...message,
            type: 'message' as const,
            name: participantNameMap?.[message.identity],
        })),
    ].sort((a, b) => a.timestamp - b.timestamp);

    return combinedData;
};
