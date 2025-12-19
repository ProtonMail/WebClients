import { useCallback, useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant, RemoteParticipant, RemoteTrackPublication, TrackPublication } from 'livekit-client';
import { RoomEvent, Track } from 'livekit-client';

import { checkAudioTrackStats as checkAudioTrackStatsUtil } from '../utils/checkAudioTrackStats';
import { useStuckTrackMonitor } from './useStuckTrackMonitor';

const MAX_SUBSCRIBED_MICROPHONE_TRACKS = 80;
const STUCK_AUDIO_CHECK_INTERVAL_MS = 7000;
const MIN_EXPECTED_PACKETS = 1;
const MIN_EXPECTED_AUDIO_BYTES_WHILE_SPEAKING = 300;
const SPEAKING_ACTIVITY_MARGIN_MS = 1000;

interface SubscriptionItem {
    participant: RemoteParticipant;
    publication: RemoteTrackPublication;
}

export const useParticipantAudioControls = () => {
    const room = useRoomContext();

    const subscribedMicrophoneTrackPublicationsRef = useRef<SubscriptionItem[]>([]);

    const getTracksToMonitor = useCallback(() => {
        return subscribedMicrophoneTrackPublicationsRef.current
            .filter(
                (item) =>
                    item.publication.isSubscribed &&
                    item.publication.isEnabled &&
                    !!item.publication.track &&
                    !item.publication.isMuted
            )
            .map((item) => item.publication);
    }, []);

    const checkAudioTrackStats = useCallback(async (publication: RemoteTrackPublication) => {
        const item = subscribedMicrophoneTrackPublicationsRef.current.find(
            (it) => it.publication.trackSid === publication.trackSid
        );

        const context = item ? { participant: item.participant, source: item.publication.source } : undefined;

        return checkAudioTrackStatsUtil(publication, context, {
            checkIntervalMs: STUCK_AUDIO_CHECK_INTERVAL_MS,
            speakingActivityMarginMs: SPEAKING_ACTIVITY_MARGIN_MS,
            minExpectedPackets: MIN_EXPECTED_PACKETS,
            minExpectedAudioBytesWhileSpeaking: MIN_EXPECTED_AUDIO_BYTES_WHILE_SPEAKING,
        });
    }, []);

    useStuckTrackMonitor({
        checkIntervalMs: STUCK_AUDIO_CHECK_INTERVAL_MS,
        minExpectedDelta: MIN_EXPECTED_PACKETS,
        getTracksToMonitor,
        checkTrackStats: checkAudioTrackStats,
    });

    useEffect(() => {
        const handleCacheUpdate = (pub: RemoteTrackPublication, participant: RemoteParticipant) => {
            subscribedMicrophoneTrackPublicationsRef.current = [
                { participant: participant, publication: pub },
                ...subscribedMicrophoneTrackPublicationsRef.current.filter(
                    (item) => item.publication?.trackSid !== pub.trackSid
                ),
            ];

            const tracksToUnsubscribe = subscribedMicrophoneTrackPublicationsRef.current.slice(
                MAX_SUBSCRIBED_MICROPHONE_TRACKS
            );

            tracksToUnsubscribe.forEach((track) => {
                track.publication.setEnabled(false);
                track.publication?.setSubscribed(false);
            });

            subscribedMicrophoneTrackPublicationsRef.current = subscribedMicrophoneTrackPublicationsRef.current.slice(
                0,
                MAX_SUBSCRIBED_MICROPHONE_TRACKS
            );
        };

        const handleRoomConnected = () => {
            for (const participant of room.remoteParticipants.values()) {
                if (participant.identity === room.localParticipant.identity) {
                    continue;
                }

                for (const publication of participant.trackPublications.values()) {
                    const pub = publication as RemoteTrackPublication;

                    if (pub.source === Track.Source.ScreenShareAudio) {
                        pub.setSubscribed(true);
                        pub.setEnabled(true);
                    }

                    if (pub.source === Track.Source.Microphone && !pub.isMuted) {
                        if (!pub.isSubscribed) {
                            pub.setSubscribed(true);
                        }
                        if (!pub.isEnabled) {
                            pub.setEnabled(true);
                        }

                        handleCacheUpdate(pub, participant);
                    }
                }
            }
        };

        const handleAudioTrackPublished = (pub: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (participant.identity === room.localParticipant.identity) {
                return;
            }

            if (pub.source === Track.Source.ScreenShareAudio) {
                pub.setSubscribed(true);
                pub.setEnabled(true);
                return;
            }

            if (pub.source === Track.Source.Microphone) {
                if (!pub.isSubscribed && !pub.isMuted) {
                    pub.setSubscribed(true);
                    pub.setEnabled(true);

                    handleCacheUpdate(pub, participant);
                }
            }
        };

        const handleTrackUnmuted = (publication: TrackPublication, participant: Participant) => {
            if (participant.identity === room.localParticipant.identity) {
                return;
            }

            if (publication.source === Track.Source.Microphone) {
                (publication as RemoteTrackPublication).setSubscribed(true);
                (publication as RemoteTrackPublication).setEnabled(true);

                handleCacheUpdate(publication as RemoteTrackPublication, participant as RemoteParticipant);
            }
        };

        const handleTrackUnpublished = (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (participant.identity === room.localParticipant.identity) {
                return;
            }

            if (publication.source === Track.Source.Microphone) {
                subscribedMicrophoneTrackPublicationsRef.current =
                    subscribedMicrophoneTrackPublicationsRef.current.filter(
                        (item) => item.publication?.trackSid !== publication.trackSid
                    );
            }
        };

        const handleTrackMuted = (publication: TrackPublication, participant: Participant) => {
            if (participant.identity === room.localParticipant.identity) {
                return;
            }

            if (publication.source === Track.Source.Microphone) {
                (publication as RemoteTrackPublication).setSubscribed(false);
                subscribedMicrophoneTrackPublicationsRef.current =
                    subscribedMicrophoneTrackPublicationsRef.current.filter(
                        (item) => item.publication?.trackSid !== publication.trackSid
                    );
            }
        };

        room.on(RoomEvent.TrackPublished, handleAudioTrackPublished);
        room.on(RoomEvent.TrackUnmuted, handleTrackUnmuted);
        room.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
        room.on(RoomEvent.TrackMuted, handleTrackMuted);
        room.on(RoomEvent.Connected, handleRoomConnected);
        return () => {
            room.off(RoomEvent.TrackPublished, handleAudioTrackPublished);
            room.off(RoomEvent.TrackUnmuted, handleTrackUnmuted);
            room.off(RoomEvent.TrackUnpublished, handleTrackUnpublished);
            room.off(RoomEvent.TrackMuted, handleTrackMuted);
            room.off(RoomEvent.Connected, handleRoomConnected);
        };
    }, [room]);
};
