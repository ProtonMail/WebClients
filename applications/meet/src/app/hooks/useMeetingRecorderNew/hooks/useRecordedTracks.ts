import { useMemo } from 'react';

import type { TrackReference } from '@livekit/components-react';
import type { LocalParticipant, RemoteParticipant } from 'livekit-client';

import { getTracksForRecording } from '../utils/getTracksForRecording';
import type { RecordingTrackInfo } from '../videoMixer/types';

interface UseRecordedTracksOptions {
    pagedParticipants: (RemoteParticipant | LocalParticipant)[];
    cameraTracks: TrackReference[];
    screenShareTracks: TrackReference[];
}

export const useRecordedTracks = ({
    pagedParticipants,
    cameraTracks,
    screenShareTracks,
}: UseRecordedTracksOptions): RecordingTrackInfo[] => {
    return useMemo(
        () => getTracksForRecording(pagedParticipants, cameraTracks, screenShareTracks),
        [pagedParticipants, cameraTracks, screenShareTracks]
    );
};
