import type { LocalVideoTrack, Room } from 'livekit-client';
import { Track } from 'livekit-client';

export const getCurrentCameraTrack = (room: Room) => {
    return [...room.localParticipant.trackPublications.values()].find(
        (publication) => publication.kind === Track.Kind.Video && publication.source === Track.Source.Camera
    )?.track as LocalVideoTrack | undefined;
};

export const hasLiveCameraTrack = (room: Room) => {
    const videoTrack = getCurrentCameraTrack(room);

    return !!videoTrack && !videoTrack.isMuted && videoTrack.mediaStreamTrack?.readyState === 'live';
};
