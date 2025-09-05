import { useEffect, useMemo, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant } from '@proton-meet/livekit-client';

import isTruthy from '@proton/utils/isTruthy';

import { ParticipantEvent, type ParticipantEventRecord } from '../types';

export const useParticipantEvents = (participantNameMap: Record<string, string>) => {
    const room = useRoomContext();

    const [events, setEvents] = useState<ParticipantEventRecord[]>([]);

    const eventsHavingNamedParticipants = useMemo(() => {
        return events
            .map((event) => ({ ...event, name: participantNameMap?.[event.identity] }))
            .filter((event) => isTruthy(event.name));
    }, [events, participantNameMap]);

    useEffect(() => {
        if (!room) {
            return;
        }

        const handleParticipantConnected = (participant: Participant) => {
            setEvents((prev) => [
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
            setEvents((prev) => [
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

    return eventsHavingNamedParticipants;
};
