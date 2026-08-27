import type { Room, TrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';

export interface ScreenShare {
    participantIdentity: string;
    publication: TrackPublication;
    track: Track;
}

export const findScreenShare = (room: Room): ScreenShare | undefined => {
    const localPublication = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);

    if (localPublication?.track) {
        return {
            participantIdentity: room.localParticipant.identity,
            publication: localPublication,
            track: localPublication.track,
        };
    }

    for (const participant of room.remoteParticipants.values()) {
        const publication = participant.getTrackPublication(Track.Source.ScreenShare);

        if (publication?.track) {
            return {
                participantIdentity: participant.identity,
                publication,
                track: publication.track,
            };
        }
    }

    return undefined;
};
