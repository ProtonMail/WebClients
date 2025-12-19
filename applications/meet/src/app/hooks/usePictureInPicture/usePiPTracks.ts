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
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.LocalTrackPublished,
    RoomEvent.LocalTrackUnpublished,
];

export function usePiPTracks(sortedParticipants: (RemoteParticipant | LocalParticipant)[]) {
    const currentScreenShareTrack = useTracks([Track.Source.ScreenShare], {
        updateOnlyOn: TRACK_UPDATE_EVENTS,
    })[0];
    const cameraTracks = useTracks([Track.Source.Camera], {
        updateOnlyOn: TRACK_UPDATE_EVENTS,
    });

    const currentCameraTracks = sortedParticipants
        .map((participant) => {
            const cameraTrack = cameraTracks.find((track) => track.participant?.identity === participant.identity);

            return cameraTrack;
        })
        .filter(isTruthy);

    const displayableCameraTracks = currentCameraTracks
        .filter((track) => !track.publication?.isMuted)
        .slice(0, MAX_CAMERA_TRACKS);

    const tracksForDisplay = [currentScreenShareTrack, ...displayableCameraTracks]
        .map((trackRef) => {
            if (!trackRef?.publication?.track) {
                return null;
            }
            return {
                track: trackRef.publication.track,
                participant: trackRef.participant!,
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
