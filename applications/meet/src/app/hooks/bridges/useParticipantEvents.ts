import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { addEvent } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { ParticipantEvent } from '@proton/meet/types/types';
import { isCaptionAgentIdentity } from '@proton/meet/utils/agents';
import { useFlag } from '@proton/unleash/useFlag';

import { JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT } from '../../constants';
import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { useAudioPlayer } from '../useAudioPlayer';

export const useParticipantEvents = () => {
    const room = useRoomContext();
    const areSoundNotificationsEnabled = useFlag('MeetSoundNotificationsEnabled');
    const meetCoreClient = useMeetCoreClient();
    const { playAudio } = useAudioPlayer('/assets/sounds/join_notification.wav');

    const dispatch = useMeetDispatch();

    useEffect(() => {
        if (!room) {
            return;
        }

        const updateActiveUuids = async () => {
            try {
                const remoteParticipants = Array.from(room.remoteParticipants.values());
                const allUuids = [
                    room.localParticipant.identity,
                    ...remoteParticipants.map((participant) => participant.identity),
                ];
                await meetCoreClient.setLivekitActiveUuids(allUuids);
            } catch (error) {
                // Logging error
                // eslint-disable-next-line no-console
                console.error('Failed to update active uuids:', error);
            }
        };

        const handleParticipantConnected = async (participant: Participant) => {
            if (!isCaptionAgentIdentity(participant.identity)) {
                dispatch(
                    addEvent([
                        {
                            identity: participant.identity,
                            eventType: ParticipantEvent.Join,
                            timestamp: Date.now(),
                            type: 'event',
                            isAgent: participant.isAgent,
                        },
                    ])
                );

                if (room.numParticipants <= JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT && areSoundNotificationsEnabled) {
                    playAudio();
                }
            }

            await updateActiveUuids();
        };

        const handleParticipantDisconnected = async (participant: Participant) => {
            if (!isCaptionAgentIdentity(participant.identity)) {
                dispatch(
                    addEvent([
                        {
                            identity: participant.identity,
                            eventType: ParticipantEvent.Leave,
                            timestamp: Date.now(),
                            type: 'event',
                            isAgent: participant.isAgent,
                        },
                    ])
                );
            }

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
    }, [room, playAudio, meetCoreClient, dispatch, areSoundNotificationsEnabled]);
};
