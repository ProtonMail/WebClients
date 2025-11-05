import { useMemo } from 'react';

import { useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';

import isTruthy from '@proton/utils/isTruthy';

const MAX_CAMERA_TRACKS = 3;

export function usePiPTracks() {
    const currentCameraTracks = useTracks([Track.Source.Camera]);
    const currentScreenShareTrack = useTracks([Track.Source.ScreenShare])[0];

    const tracksForDisplay = useMemo(() => {
        const displayableCameraTracks = currentCameraTracks
            .filter((track) => !track.publication.isMuted && track.publication.isEnabled)
            .slice(0, MAX_CAMERA_TRACKS);

        return [currentScreenShareTrack, ...displayableCameraTracks]
            .map((trackRef) => {
                if (!trackRef?.publication.track) {
                    return null;
                }
                return {
                    track: trackRef.publication.track,
                    participant: trackRef.participant!,
                    isScreenShare: trackRef.source === Track.Source.ScreenShare,
                };
            })
            .filter(isTruthy);
    }, [currentScreenShareTrack, currentCameraTracks]);

    return {
        tracksForDisplay,
    };
}
