import type { TrackReference } from '@livekit/components-react';
import type { Participant, Track } from 'livekit-client';

import type { RecordingTrackInfo } from '../videoMixer/types';

export const getTracksForRecording = (
    pagedParticipants: Participant[],
    cameraTracks: TrackReference[],
    screenShareTracks: TrackReference[]
): RecordingTrackInfo[] => {
    const screenShareTrack = screenShareTracks?.[0];

    const participantTracksForRecording = pagedParticipants.map((participant, index) => {
        const cameraTrackReference = cameraTracks.find(
            (trackRef) => trackRef.participant?.identity === participant.identity
        );

        return {
            track: cameraTrackReference?.publication.track as Track,
            participant: participant,
            isScreenShare: false,
            participantIndex: index,
        };
    });

    if (!screenShareTrack) {
        return participantTracksForRecording;
    }

    return [
        {
            track: screenShareTrack.publication.track as Track,
            participant: screenShareTrack.participant,
            isScreenShare: true,
            participantIndex: 0,
        },
        ...participantTracksForRecording,
    ];
};
