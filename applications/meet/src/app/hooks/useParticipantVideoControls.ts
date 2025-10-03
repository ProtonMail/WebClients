import { useEffect, useRef } from 'react';

import { useLocalParticipant, useRoomContext, useTracks } from '@livekit/components-react';
import type { RemoteParticipant, RemoteTrackPublication } from '@proton-meet/livekit-client';
import { RoomEvent, Track } from '@proton-meet/livekit-client';

import { useMeetContext } from '../contexts/MeetContext';
import { useParticipantQuality } from './useParticipantQuality';

export const useParticipantVideoControls = () => {
    const { pagedParticipants } = useMeetContext();
    const { participantsWithDisabledVideos, disableVideos } = useMeetContext();
    const { localParticipant } = useLocalParticipant();

    const participantQuality = useParticipantQuality();

    const room = useRoomContext();

    const tracks = useTracks([Track.Source.Camera]);

    const participantQualityRef = useRef(participantQuality);

    participantQualityRef.current = participantQuality;

    const tracksToTurnOn = tracks.filter(
        (track) =>
            track.participant.identity !== localParticipant.identity &&
            pagedParticipants.some((participant) => participant.identity === track.participant.identity) &&
            !disableVideos &&
            !participantsWithDisabledVideos.includes(track.participant.identity) &&
            !track.publication.isEnabled
    );

    const tracksToTurnOff = tracks.filter(
        (track) =>
            track.participant.identity !== localParticipant.identity &&
            (!pagedParticipants.some((participant) => participant.identity === track.participant.identity) ||
                disableVideos ||
                participantsWithDisabledVideos.includes(track.participant.identity)) &&
            track.publication.isEnabled
    );

    const tracksToTurnOnSignature = tracksToTurnOn
        .map((track) => track.publication.trackSid)
        .sort()
        .join(',');
    const tracksToTurnOffSignature = tracksToTurnOff
        .map((track) => track.publication.trackSid)
        .sort()
        .join(',');

    const initializedParticipantVideos = useRef(false);

    // Subscribing to the tracks of the paged participants upon joing the room
    useEffect(() => {
        if (initializedParticipantVideos.current || pagedParticipants.length <= 1) {
            return;
        }

        (
            pagedParticipants.filter(
                (participant) => participant.identity !== localParticipant.identity
            ) as RemoteParticipant[]
        ).forEach((rp: RemoteParticipant) => {
            rp.videoTrackPublications.forEach((pub) => {
                if (!pub.isSubscribed) {
                    pub.setSubscribed(true);
                }
            });
        });

        initializedParticipantVideos.current = true;
    }, [pagedParticipants]);

    // Subscribing to remote video tracks upon publishing, also setting the desired quality, except for screenshare as it has a fixed quality
    useEffect(() => {
        const handleVideoTrackPublished = (pub: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (participant.identity === room.localParticipant.identity) {
                return;
            }

            if (pub.source === Track.Source.Camera) {
                if (!pub.isSubscribed) {
                    pub.setSubscribed(true);
                }

                pub.setVideoQuality(participantQualityRef.current);
            } else if (pub.source === Track.Source.ScreenShare) {
                // We have only quality setting for screenshare, so we don't need to set the quality
                pub.setSubscribed(true);
            }
        };

        room.on(RoomEvent.TrackPublished, handleVideoTrackPublished);

        return () => {
            room.off(RoomEvent.TrackPublished, handleVideoTrackPublished);
        };
    }, [room]);

    // Updating the quality of all subscribed camera tracks upon quality change
    useEffect(() => {
        if (initializedParticipantVideos.current) {
            room.remoteParticipants.forEach((participant) => {
                const validTracks = [...participant.trackPublications.values()].filter(
                    (track) => track.source === Track.Source.Camera && track.isSubscribed && track.isEnabled
                );
                validTracks.forEach((track) => {
                    track.setVideoQuality(participantQualityRef.current);
                });
            });
        }
    }, [room, participantQuality]);

    useEffect(() => {
        tracksToTurnOn.forEach((track) => {
            if (track.publication.isSubscribed) {
                // Setting the desired quality for the track
                (track.publication as RemoteTrackPublication).setVideoQuality(participantQualityRef.current);
                (track.publication as RemoteTrackPublication).setEnabled(true);
            }
        });
    }, [tracksToTurnOnSignature]);

    useEffect(() => {
        tracksToTurnOff.forEach((track) => (track.publication as RemoteTrackPublication).setEnabled(false));
    }, [tracksToTurnOffSignature]);
};
