import { useCallback, useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant, RemoteParticipant, RemoteTrackPublication, TrackPublication } from 'livekit-client';
import { RoomEvent, Track } from 'livekit-client';

import { AudioTrackSubscriptionCache } from '../contexts/TrackSubscriptionCache/AudioTrackSubscriptionCache';
import { checkAudioTrackStats as checkAudioTrackStatsUtil } from '../utils/checkAudioTrackStats';
import { useStuckTrackMonitor } from './useStuckTrackMonitor';

const MAX_SUBSCRIBED_MICROPHONE_TRACKS = 80;
const STUCK_AUDIO_CHECK_INTERVAL_MS = 7000;
const MIN_EXPECTED_PACKETS = 1;
const MIN_EXPECTED_AUDIO_BYTES_WHILE_SPEAKING = 300;
const SPEAKING_ACTIVITY_MARGIN_MS = 1000;
const MAX_CONCEALED_SAMPLES_DELTA = 10000;

export const useParticipantAudioControls = () => {
    const room = useRoomContext();

    const audioTrackCacheRef = useRef<AudioTrackSubscriptionCache>(
        new AudioTrackSubscriptionCache(MAX_SUBSCRIBED_MICROPHONE_TRACKS)
    );

    const getTracksToMonitor = useCallback(() => {
        return audioTrackCacheRef.current.getQueueManagedTracksToMonitor();
    }, []);

    const checkAudioTrackStats = useCallback(async (publication: RemoteTrackPublication) => {
        const participant = audioTrackCacheRef.current.getParticipantForTrack(publication);

        const context = participant ? { participant, source: publication.source } : undefined;

        return checkAudioTrackStatsUtil(publication, context, {
            checkIntervalMs: STUCK_AUDIO_CHECK_INTERVAL_MS,
            speakingActivityMarginMs: SPEAKING_ACTIVITY_MARGIN_MS,
            minExpectedPackets: MIN_EXPECTED_PACKETS,
            minExpectedAudioBytesWhileSpeaking: MIN_EXPECTED_AUDIO_BYTES_WHILE_SPEAKING,
            maxConcealedSamplesDelta: MAX_CONCEALED_SAMPLES_DELTA,
        });
    }, []);

    const resetAudioTrack = useCallback(async (publication: RemoteTrackPublication) => {
        await audioTrackCacheRef.current?.resetQueueManagedTrack(publication);
    }, []);

    useStuckTrackMonitor({
        checkIntervalMs: STUCK_AUDIO_CHECK_INTERVAL_MS,
        minExpectedDelta: MIN_EXPECTED_PACKETS,
        getTracksToMonitor,
        checkTrackStats: checkAudioTrackStats,
        resetTrack: resetAudioTrack,
    });

    useEffect(() => {
        const cache = audioTrackCacheRef.current;

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
                        cache.registerWithParticipant(pub, participant);
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

            if (pub.source === Track.Source.Microphone && !pub.isMuted) {
                cache.registerWithParticipant(pub, participant);
            }
        };

        const handleTrackUnmuted = (publication: TrackPublication, participant: Participant) => {
            if (participant.identity === room.localParticipant.identity) {
                return;
            }

            if (publication.source === Track.Source.Microphone) {
                const pub = publication as RemoteTrackPublication;
                // Registering brings the track forward in the cache and handles subscription/enabling
                cache.registerWithParticipant(pub, participant as RemoteParticipant);
            }
        };

        const handleTrackUnpublished = (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (participant.identity === room.localParticipant.identity) {
                return;
            }

            if (publication.source === Track.Source.Microphone) {
                cache.handleTrackUnpublished(publication);
            }
        };

        const handleRoomDisconnected = () => {
            cache.destroy();
            audioTrackCacheRef.current = new AudioTrackSubscriptionCache(MAX_SUBSCRIBED_MICROPHONE_TRACKS);
        };

        room.on(RoomEvent.TrackPublished, handleAudioTrackPublished);
        room.on(RoomEvent.TrackUnmuted, handleTrackUnmuted);
        room.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
        room.on(RoomEvent.Connected, handleRoomConnected);
        room.on(RoomEvent.Disconnected, handleRoomDisconnected);
        return () => {
            room.off(RoomEvent.TrackPublished, handleAudioTrackPublished);
            room.off(RoomEvent.TrackUnmuted, handleTrackUnmuted);
            room.off(RoomEvent.TrackUnpublished, handleTrackUnpublished);
            room.off(RoomEvent.Connected, handleRoomConnected);
            room.off(RoomEvent.Disconnected, handleRoomDisconnected);
        };
    }, [room]);
};
