import { useEffect, useMemo, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

import { JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT } from '../constants';
import { ParticipantEvent, type ParticipantEventRecord } from '../types';
import { useAudioPlayer } from './useAudioPlayer';

export const useParticipantEvents = (participantNameMap: Record<string, string>) => {
    const room = useRoomContext();
    const areSoundNotificationsEnabled = useFlag('MeetSoundNotificationsEnabled');
    const { playAudio } = useAudioPlayer('/assets/sounds/join_notification.wav');

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

            if (room.numParticipants <= JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT && areSoundNotificationsEnabled) {
                playAudio();
            }
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
    }, [room, participantNameMap, playAudio]);

    return eventsHavingNamedParticipants;
};
