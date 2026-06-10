import type { TrackReference } from '@livekit/components-react';
import type { LocalParticipant, RemoteParticipant, Track } from 'livekit-client';

import type { RecordingTrackInfo } from './types';

export const getTracksForRecording = (
    pagedParticipants: (RemoteParticipant | LocalParticipant)[],
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

    const allTracks = screenShareTrack
        ? [
              {
                  track: screenShareTrack.publication.track as Track,
                  participant: screenShareTrack.participant,
                  isScreenShare: true,
                  participantIndex: 0,
              },
              ...participantTracksForRecording,
          ]
        : participantTracksForRecording;

    return allTracks;
};

export const supportsTrackProcessor = () => {
    return (
        typeof (window as any).MediaStreamTrackProcessor !== 'undefined' &&
        typeof (window as any).VideoFrame !== 'undefined'
    );
};

export const createMediaStreamTrackProcessor = (track: MediaStreamTrack) => {
    try {
        // In Safari, MediaStreamTrackProcessor is available in Worker context
        return new MediaStreamTrackProcessor({ track });
    } catch (error) {
        return null;
    }
};
