import { useTracks } from '@livekit/components-react';
import { RoomEvent, Track } from 'livekit-client';
import type { LocalParticipant, RemoteParticipant } from 'livekit-client';

import isTruthy from '@proton/utils/isTruthy';

const MAX_CAMERA_TRACKS = 3;

// Only update on events that actually affect track availability, not on quality/stream state changes
const TRACK_UPDATE_EVENTS = [
    RoomEvent.TrackPublished,
    RoomEvent.TrackUnpublished,
    RoomEvent.TrackMuted,
    RoomEvent.TrackUnmuted,
    RoomEvent.LocalTrackPublished,
    RoomEvent.LocalTrackUnpublished,
    RoomEvent.TrackStreamStateChanged,
];

export function usePiPTracks(sortedParticipants: (RemoteParticipant | LocalParticipant)[]) {
    const currentScreenShareTrack = useTracks([Track.Source.ScreenShare], {
        updateOnlyOn: TRACK_UPDATE_EVENTS,
        onlySubscribed: false,
    })[0];

    const cameraTracks = useTracks([Track.Source.Camera], {
        updateOnlyOn: TRACK_UPDATE_EVENTS,
        onlySubscribed: false,
    });

    const currentCameraPublications = sortedParticipants
        .map((participant) => {
            return cameraTracks.find((track) => track.participant?.identity === participant.identity);
        })
        .filter(isTruthy);

    const displayableCameraTracks = currentCameraPublications
        .filter((item) => item.publication && !item.publication?.isMuted)
        .slice(0, MAX_CAMERA_TRACKS);

    const tracksForDisplay = [currentScreenShareTrack, ...displayableCameraTracks]
        .map((trackRef) => {
            if (!trackRef) {
                return null;
            }

            return {
                track: trackRef.publication.track,
                participant: trackRef.participant!,
                publication: trackRef.publication,
                isScreenShare: trackRef.publication?.source === Track.Source.ScreenShare,
            };
        })
        .filter(isTruthy);

    const tracksKey = [currentScreenShareTrack, ...displayableCameraTracks]
        .map((trackRef) => {
            const sid = trackRef?.publication?.trackSid || '';
            const hasTrack = !!trackRef?.publication?.track;
            const isSubscribed = !!trackRef?.publication?.isSubscribed;
            const isEnabled = !!trackRef?.publication?.isEnabled;
            return `${sid}:${hasTrack}:${isSubscribed}:${isEnabled}`;
        })
        .join(',');

    return {
        tracksForDisplay,
        tracksKey,
    };
}
