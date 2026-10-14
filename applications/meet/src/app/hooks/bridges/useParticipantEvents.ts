import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { logger } from '@protontech/logger';
import type { Participant } from 'livekit-client';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { addEvent } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectJoinLeaveSoundsEnabled } from '@proton/meet/store/slices/settings';
import { ParticipantEvent } from '@proton/meet/types/types';
import { isCaptionAgentIdentity } from '@proton/meet/utils/agents';
import { useFlag } from '@proton/unleash/useFlag';

import { JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT } from '../../constants';
import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { useAudioPlayer } from '../useAudioPlayer';
import { useLatest } from '../useLatest';

export const useParticipantEvents = () => {
    const room = useRoomContext();
    const areSoundNotificationsEnabled = useFlag('MeetSoundNotificationsEnabled');
    const isJoinLeaveSoundsFeatureEnabled = useFlag('MeetJoinLeaveSoundsNotifications');
    const joinLeaveSoundsEnabled = useMeetSelector(selectJoinLeaveSoundsEnabled);
    const meetCoreClient = useMeetCoreClient();
    const { playAudio } = useAudioPlayer('/assets/sounds/join_notification.wav');
    const { playAudio: playJoinSound } = useAudioPlayer('/assets/sounds/participant_joined.wav');
    const { playAudio: playLeaveSound } = useAudioPlayer('/assets/sounds/participant_left.wav');

    const joinLeaveSoundsEnabledRef = useLatest(joinLeaveSoundsEnabled);

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
                const isAgentInLivekit = remoteParticipants.some((participant) => participant.isAgent);
                await meetCoreClient.setLivekitActiveUuids(allUuids, isAgentInLivekit);
            } catch (error) {
                logger.error('Failed to update active uuids:', error);
            }
        };

        // A full reconnect replays every remote participant as leaving and rejoining.
        let isReconnecting = false;
        const handleReconnecting = () => {
            isReconnecting = true;
        };
        // Deferred because the buffered rejoins are emitted synchronously right after 'reconnected'.
        const handleReconnected = () => {
            setTimeout(() => {
                isReconnecting = false;
            });
        };

        const shouldPlayJoinLeaveSound = () => {
            if (isReconnecting || !isJoinLeaveSoundsFeatureEnabled || !joinLeaveSoundsEnabledRef.current) {
                return false;
            }

            const remoteParticipantCount = Array.from(room.remoteParticipants.values()).filter(
                (participant) => !isCaptionAgentIdentity(participant.identity)
            ).length;

            return remoteParticipantCount + 1 <= JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT;
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

                if (isJoinLeaveSoundsFeatureEnabled) {
                    if (shouldPlayJoinLeaveSound()) {
                        playJoinSound();
                    }
                } else if (
                    room.numParticipants <= JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT &&
                    areSoundNotificationsEnabled
                ) {
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

                // LiveKit emits 'reconnecting' only after it has unwound the remote participants.
                queueMicrotask(() => {
                    if (shouldPlayJoinLeaveSound()) {
                        playLeaveSound();
                    }
                });
            }

            await updateActiveUuids();
        };

        room.on('participantConnected', handleParticipantConnected);
        room.on('participantDisconnected', handleParticipantDisconnected);
        room.on('reconnecting', handleReconnecting);
        room.on('reconnected', handleReconnected);

        // refresh active uuids every 10 seconds
        const intervalId = setInterval(() => {
            void updateActiveUuids();
        }, 10_000);

        return () => {
            room.off('participantConnected', handleParticipantConnected);
            room.off('participantDisconnected', handleParticipantDisconnected);
            room.off('reconnecting', handleReconnecting);
            room.off('reconnected', handleReconnected);
            clearInterval(intervalId);
        };
    }, [
        room,
        playAudio,
        playJoinSound,
        playLeaveSound,
        meetCoreClient,
        dispatch,
        areSoundNotificationsEnabled,
        isJoinLeaveSoundsFeatureEnabled,
        joinLeaveSoundsEnabledRef,
    ]);
};
