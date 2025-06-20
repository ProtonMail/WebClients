import { useEffect, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import { useMeetContext } from '../contexts/MeetContext';
import type { ParticipantEventRecord } from '../types';
import { ParticipantEvent } from '../types';

export const useParticipantEvents = () => {
    const room = useRoomContext();
    const { participantEvents, setParticipantEvents, participantNameMap } = useMeetContext();

    // The participant names are not available immediately, so we need to store the events and add them as the names become available
    const [pendingEvents, setPendingEvents] = useState<ParticipantEventRecord[]>([]);

    useEffect(() => {
        const filteredEvents = pendingEvents.filter((event) => {
            return participantNameMap[event.identity] !== undefined;
        });

        if (filteredEvents.length === 0) {
            return;
        }

        setParticipantEvents((prev) => [
            ...prev,
            ...filteredEvents.map((event) => ({ ...event, name: participantNameMap[event.identity] })),
        ]);

        setPendingEvents((prev) => prev.filter((event) => !participantNameMap[event.identity]));
    }, [pendingEvents, participantNameMap, setParticipantEvents]);

    useEffect(() => {
        if (!room) {
            return;
        }

        const handleParticipantConnected = (participant: Participant) => {
            setPendingEvents((prev) => [
                ...prev,
                {
                    identity: participant.identity,
                    name: '',
                    eventType: ParticipantEvent.Join,
                    timestamp: Date.now(),
                    type: 'event',
                },
            ]);
        };

        const handleParticipantDisconnected = (participant: Participant) => {
            setPendingEvents((prev) => [
                ...prev,
                {
                    identity: participant.identity,
                    name: '',
                    eventType: ParticipantEvent.Leave,
                    timestamp: Date.now(),
                    type: 'event',
                },
            ]);
        };

        room.on('participantConnected', handleParticipantConnected);
        room.on('participantDisconnected', handleParticipantDisconnected);

        return () => {
            room.off('participantConnected', handleParticipantConnected);
            room.off('participantDisconnected', handleParticipantDisconnected);
        };
    }, [room, participantNameMap]);

    return participantEvents;
};
