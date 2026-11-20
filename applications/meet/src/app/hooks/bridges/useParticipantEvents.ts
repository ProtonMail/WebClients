import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { addEvent } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectJoinLeaveSoundsEnabled } from '@proton/meet/store/slices/settings';
import { ParticipantEvent } from '@proton/meet/types/types';
import { isCaptionAgentIdentity } from '@proton/meet/utils/agents';
import { meetingLogger } from '@proton/meet/utils/meetingLogger';
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
                meetingLogger.error('Failed to update active uuids:', error);
            }
        };

        // A full reconnect replays every remote participant as leaving and rejoining. The window's id is its start
        // time so it stays unique when this effect re-subscribes mid-meeting.
        let localReconnectId: number | undefined;
        // Ends only on 'reconnected', so the sounds stay silent after a failed reconnect while the recorded events
        // stop carrying the failed window's id once the room disconnects.
        let soundsMutedReconnectId: number | undefined;
        const handleReconnecting = () => {
            localReconnectId = Date.now();
            soundsMutedReconnectId = localReconnectId;
        };
        // Deferred because the buffered rejoins are emitted synchronously right after 'reconnected'.
        const handleReconnected = () => {
            const reconnectedId = soundsMutedReconnectId;
            setTimeout(() => {
                if (soundsMutedReconnectId === reconnectedId) {
                    soundsMutedReconnectId = undefined;
                    localReconnectId = undefined;
                }
            });
        };
        const handleDisconnected = () => {
            localReconnectId = undefined;
        };

        // A leave's reconnect id is known only once LiveKit emits 'reconnecting', after it has unwound the remote
        // participants. Joins are queued too so the store keeps LiveKit's emit order.
        const queueParticipantEvent = (participant: Participant, eventType: ParticipantEvent) => {
            const timestamp = Date.now();
            queueMicrotask(() => {
                dispatch(
                    addEvent([
                        {
                            identity: participant.identity,
                            eventType,
                            timestamp,
                            type: 'event',
                            isAgent: participant.isAgent,
                            localReconnectId,
                        },
                    ])
                );
            });
        };

        const shouldPlayJoinLeaveSound = () => {
            if (
                soundsMutedReconnectId !== undefined ||
                !isJoinLeaveSoundsFeatureEnabled ||
                !joinLeaveSoundsEnabledRef.current
            ) {
                return false;
            }

            const remoteParticipantCount = Array.from(room.remoteParticipants.values()).filter(
                (participant) => !isCaptionAgentIdentity(participant.identity)
            ).length;

            return remoteParticipantCount + 1 <= JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT;
        };

        const handleParticipantConnected = async (participant: Participant) => {
            if (!isCaptionAgentIdentity(participant.identity)) {
                queueParticipantEvent(participant, ParticipantEvent.Join);

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
                queueParticipantEvent(participant, ParticipantEvent.Leave);

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
        room.on('disconnected', handleDisconnected);

        // refresh active uuids every 10 seconds
        const intervalId = setInterval(() => {
            void updateActiveUuids();
        }, 10_000);

        return () => {
            room.off('participantConnected', handleParticipantConnected);
            room.off('participantDisconnected', handleParticipantDisconnected);
            room.off('reconnecting', handleReconnecting);
            room.off('reconnected', handleReconnected);
            room.off('disconnected', handleDisconnected);
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
