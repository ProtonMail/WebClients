import { useEffect, useMemo, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

import { JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT } from '../constants';
import { useWasmApp } from '../contexts/WasmContext';
import { ParticipantEvent, type ParticipantEventRecord } from '../types';
import { useAudioPlayer } from './useAudioPlayer';

export const useParticipantEvents = (participantNameMap: Record<string, string>) => {
    const room = useRoomContext();
    const areSoundNotificationsEnabled = useFlag('MeetSoundNotificationsEnabled');
    const wasmApp = useWasmApp();
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

        const updateActiveUuids = async () => {
            if (!wasmApp) {
                return;
            }

            try {
                const remoteParticipants = Array.from(room.remoteParticipants.values());
                const allUuids = [
                    room.localParticipant.identity,
                    ...remoteParticipants.map((participant) => participant.identity),
                ];
                await wasmApp.setLivekitActiveUuids(allUuids);
            } catch (error) {
                // Logging error
                // eslint-disable-next-line no-console
                console.error('Failed to update active uuids:', error);
            }
        };

        const handleParticipantConnected = async (participant: Participant) => {
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
            await updateActiveUuids();
        };

        const handleParticipantDisconnected = async (participant: Participant) => {
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

            await updateActiveUuids();
        };

        room.on('participantConnected', handleParticipantConnected);
        room.on('participantDisconnected', handleParticipantDisconnected);

        // refresh active uuids every 10 seconds
        const intervalId = setInterval(() => {
            void updateActiveUuids();
        }, 10_000);

        return () => {
            room.off('participantConnected', handleParticipantConnected);
            room.off('participantDisconnected', handleParticipantDisconnected);
            clearInterval(intervalId);
        };
    }, [room, participantNameMap, playAudio]);

    return eventsHavingNamedParticipants;
};
