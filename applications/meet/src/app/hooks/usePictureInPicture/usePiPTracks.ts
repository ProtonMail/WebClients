import { type TrackReference, useTracks } from '@livekit/components-react';
import { type Participant, RoomEvent, Track } from 'livekit-client';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectSelfView } from '@proton/meet/store/slices/settings';
import isTruthy from '@proton/utils/isTruthy';

import { useParticipantDisplayColors } from '../useParticipantDisplayColors';
import { type PiPTile, type TrackInfo, isDrawablePiPTile } from './types';

const MAX_TILES = 4;

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

const toTrackInfo = ({ participant, publication }: TrackReference): TrackInfo => ({
    kind: 'track',
    track: publication.track,
    participant,
    publication,
    isScreenShare: publication.source === Track.Source.ScreenShare,
});

const getTileKey = (tile: PiPTile) => {
    if (tile.kind === 'placeholder') {
        return `placeholder:${tile.participant.identity}`;
    }

    const { trackSid, track, isSubscribed, isEnabled } = tile.publication;
    return `${trackSid}:${!!track}:${!!isSubscribed}:${!!isEnabled}`;
};

export function usePiPTracks(sortedParticipants: Participant[]) {
    const screenShareTracks = useTracks([Track.Source.ScreenShare], {
        updateOnlyOn: TRACK_UPDATE_EVENTS,
        onlySubscribed: false,
    });
    const remoteScreenShareTrack = screenShareTracks.find((trackRef) => !trackRef.participant.isLocal);
    const localParticipant = sortedParticipants.find((participant) => participant.isLocal);
    const selfView = useMeetSelector(selectSelfView);

    const {
        participantColors: { backgroundColor, profileColor },
    } = useParticipantDisplayColors(localParticipant?.identity);

    const cameraTracks = useTracks([Track.Source.Camera], {
        updateOnlyOn: TRACK_UPDATE_EVENTS,
        onlySubscribed: false,
    });

    const findCameraTile = (participant: Participant) => {
        const cameraTrack = cameraTracks.find((track) => track.participant?.identity === participant.identity);
        return cameraTrack && !cameraTrack.publication.isMuted ? toTrackInfo(cameraTrack) : undefined;
    };

    const remoteCameraTiles = sortedParticipants
        .filter((participant) => !participant.isLocal)
        .map(findCameraTile)
        .filter(isTruthy);

    const localTile: PiPTile | undefined =
        localParticipant &&
        (findCameraTile(localParticipant) ?? {
            kind: 'placeholder',
            participant: localParticipant,
            backgroundColorClassName: backgroundColor,
            profileColorClassName: profileColor,
        });

    const otherTiles = [remoteScreenShareTrack && toTrackInfo(remoteScreenShareTrack), ...remoteCameraTiles].filter(
        isTruthy
    );

    // Like the grid, keep your own tile when nothing else can be drawn, even with self view off
    const showLocalTile = selfView || !otherTiles.some(isDrawablePiPTile);
    const tilesForDisplay =
        showLocalTile && localTile && otherTiles.length < MAX_TILES
            ? [localTile, ...otherTiles]
            : otherTiles.slice(0, MAX_TILES);

    return {
        tilesForDisplay,
        tracksKey: tilesForDisplay.map(getTileKey).join(','),
    };
}
