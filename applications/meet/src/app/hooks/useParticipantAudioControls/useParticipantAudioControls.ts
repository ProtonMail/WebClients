import { useCallback, useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant, RemoteParticipant, RemoteTrackPublication, TrackPublication } from 'livekit-client';
import { RoomEvent, Track } from 'livekit-client';

import { checkAudioTrackStats as checkAudioTrackStatsUtil } from '../../utils/checkAudioTrackStats';
import { useStuckTrackMonitor } from '../useStuckTrackMonitor';

const MAX_SUBSCRIBED_MICROPHONE_TRACKS = 80;
const STUCK_AUDIO_CHECK_INTERVAL_MS = 7000;
const MIN_EXPECTED_PACKETS = 1;
const MIN_EXPECTED_AUDIO_BYTES_WHILE_SPEAKING = 300;
const SPEAKING_ACTIVITY_MARGIN_MS = 1000;

interface SubscriptionItem {
    participant: RemoteParticipant;
    publication: RemoteTrackPublication;
}

export const sortAudioPublications = <T extends SubscriptionItem>(publications: T[]): T[] => {
    return publications.sort((a, b) => {
        if (!a.publication) {
            return 1;
        }

        if (!b.publication) {
            return -1;
        }

        if (a.publication.isMuted !== b.publication.isMuted) {
            return a.publication.isMuted ? 1 : -1;
        }

        return (b?.participant?.lastSpokeAt?.getTime() ?? 0) - (a?.participant?.lastSpokeAt?.getTime() ?? 0);
    });
};

export const useParticipantAudioControls = () => {
    const room = useRoomContext();

    const subscribedMicrophoneTrackPublicationsRef = useRef<Map<string, SubscriptionItem>>(new Map());
    const lastSortingResultRef = useRef<SubscriptionItem[]>([]);

    const getTracksToMonitor = useCallback(() => {
        return Array.from(subscribedMicrophoneTrackPublicationsRef.current.values())
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
        const item = subscribedMicrophoneTrackPublicationsRef.current.get(publication.trackSid);

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
        const addToCache = (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            subscribedMicrophoneTrackPublicationsRef.current.set(publication.trackSid, {
                participant,
                publication,
            });
        };

        const handleCacheUpdate = (pub: RemoteTrackPublication, participant: RemoteParticipant) => {
            addToCache(pub, participant);

            const cache = subscribedMicrophoneTrackPublicationsRef.current;

            if (cache.size <= MAX_SUBSCRIBED_MICROPHONE_TRACKS) {
                return;
            }

            const sortedCache = sortAudioPublications(Array.from(cache.values()));

            lastSortingResultRef.current = sortedCache;

            const tracksToUnsubscribe = sortedCache.slice(MAX_SUBSCRIBED_MICROPHONE_TRACKS);

            tracksToUnsubscribe.forEach((track) => {
                track.publication.setSubscribed(false);
                cache.delete(track.publication.trackSid);
            });
        };

        const handleRoomConnected = () => {
            const microphoneAudioPublications: SubscriptionItem[] = [];

            for (const participant of room.remoteParticipants.values()) {
                if (participant.identity === room.localParticipant.identity) {
                    continue;
                }

                for (const publication of participant.audioTrackPublications.values()) {
                    const pub = publication as RemoteTrackPublication;

                    if (pub.source === Track.Source.ScreenShareAudio) {
                        pub.setSubscribed(true);
                        pub.setEnabled(true);
                    }

                    if (pub.source === Track.Source.Microphone) {
                        microphoneAudioPublications.push({ publication: pub, participant });
                    }
                }
            }

            const sortedMicrophoneAudioPublications = sortAudioPublications(microphoneAudioPublications);

            const publicationsToRegister = sortedMicrophoneAudioPublications.slice(0, MAX_SUBSCRIBED_MICROPHONE_TRACKS);

            for (const publication of publicationsToRegister) {
                if (!publication.publication.isSubscribed) {
                    publication.publication.setSubscribed(true);
                    publication.publication.setEnabled(true);
                }

                handleCacheUpdate(publication.publication, publication.participant);
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

            if (pub.source === Track.Source.Microphone && !pub.isSubscribed) {
                // If the cache if already full, we prevent adding a new track that would be unsubscribed immediately
                if (subscribedMicrophoneTrackPublicationsRef.current.size >= MAX_SUBSCRIBED_MICROPHONE_TRACKS) {
                    const lastItemOfSortedResult = lastSortingResultRef.current.at(-1);

                    if (lastItemOfSortedResult) {
                        const comparison = sortAudioPublications([
                            lastItemOfSortedResult,
                            { publication: pub, participant },
                        ]);

                        if (comparison[0].publication.trackSid === lastItemOfSortedResult.publication.trackSid) {
                            return;
                        }
                    }
                }

                pub.setSubscribed(true);
                pub.setEnabled(true);

                handleCacheUpdate(pub, participant);
            }
        };

        const handleTrackUnmuted = (publication: TrackPublication, participant: Participant) => {
            if (participant.identity === room.localParticipant.identity) {
                return;
            }

            if (publication.source === Track.Source.Microphone && !publication.isSubscribed) {
                const pub = publication as RemoteTrackPublication;
                pub.setSubscribed(true);
                pub.setEnabled(true);

                handleCacheUpdate(pub, participant as RemoteParticipant);
            }
        };

        const handleTrackUnpublished = (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (participant.identity === room.localParticipant.identity) {
                return;
            }

            if (publication.source === Track.Source.Microphone) {
                subscribedMicrophoneTrackPublicationsRef.current.delete(publication.trackSid);
            }
        };

        const handleActiveSpeakerChanged = (participants: Participant[]) => {
            participants.forEach((participant) => {
                if (participant.identity === room.localParticipant.identity) {
                    return;
                }

                const microphoneAudioPublication = [...participant.audioTrackPublications.values()].find(
                    (item) => item.source === Track.Source.Microphone
                ) as RemoteTrackPublication;

                if (microphoneAudioPublication && !microphoneAudioPublication.isSubscribed) {
                    microphoneAudioPublication.setSubscribed(true);
                    microphoneAudioPublication.setEnabled(true);
                    handleCacheUpdate(microphoneAudioPublication, participant as RemoteParticipant);
                }
            });
        };

        const handleRoomDisconnected = () => {
            subscribedMicrophoneTrackPublicationsRef.current.clear();
        };

        room.on(RoomEvent.TrackPublished, handleAudioTrackPublished);
        room.on(RoomEvent.TrackUnmuted, handleTrackUnmuted);
        room.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
        room.on(RoomEvent.Connected, handleRoomConnected);
        room.on(RoomEvent.Disconnected, handleRoomDisconnected);
        room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChanged);
        return () => {
            room.off(RoomEvent.TrackPublished, handleAudioTrackPublished);
            room.off(RoomEvent.TrackUnmuted, handleTrackUnmuted);
            room.off(RoomEvent.TrackUnpublished, handleTrackUnpublished);
            room.off(RoomEvent.Connected, handleRoomConnected);
            room.off(RoomEvent.Disconnected, handleRoomDisconnected);
            room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChanged);
        };
    }, [room]);
};
