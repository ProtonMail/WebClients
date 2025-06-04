import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import { useMeetContext } from '../contexts/MeetContext';
import { ParticipantEvent } from '../types';

export const useParticipantEvents = () => {
    const room = useRoomContext();
    const { participantEvents, setParticipantEvents } = useMeetContext();

    useEffect(() => {
        if (!room) {
            return;
        }

        const handleParticipantConnected = (participant: Participant) => {
            setParticipantEvents((prev) => [
                ...prev,
                {
                    identity: participant.identity,
                    name: participant.name || participant.identity,
                    eventType: ParticipantEvent.Join,
                    timestamp: Date.now(),
                    type: 'event',
                },
            ]);
        };

        const handleParticipantDisconnected = (participant: Participant) => {
            setParticipantEvents((prev) => [
                ...prev,
                {
                    identity: participant.identity,
                    name: participant.name || participant.identity,
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
    }, [room]);

    return participantEvents;
};
