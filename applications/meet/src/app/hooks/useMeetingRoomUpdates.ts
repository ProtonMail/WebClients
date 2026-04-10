import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectChatMessages, selectEvents } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/meetingInfo';
import type { MeetChatMessage, ParticipantEventRecord } from '@proton/meet/types/types';

export const useMeetingRoomUpdates = (): (MeetChatMessage | ParticipantEventRecord)[] => {
    const participantEvents = useMeetSelector(selectEvents);
    const chatMessages = useMeetSelector(selectChatMessages);
    const participantDecryptedNameMap = useMeetSelector(selectParticipantDecryptedNameMap);

    const combinedData = [
        ...participantEvents.map((event) => ({
            ...event,
            type: 'event' as const,
            name: participantDecryptedNameMap?.[event.identity],
        })),
        ...chatMessages.map((message) => ({
            ...message,
            type: 'message' as const,
            name: participantDecryptedNameMap?.[message.identity],
        })),
    ].sort((a, b) => a.timestamp - b.timestamp);

    return combinedData;
};
