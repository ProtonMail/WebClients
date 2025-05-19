import { useCallback } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { VideoQuality } from 'livekit-client';
import { Track } from 'livekit-client';

export function useSetLocalVideoQuality() {
    const { localParticipant } = useLocalParticipant();

    const setQuality = useCallback(
        (quality: VideoQuality) => {
            if (!localParticipant) {
                return;
            }

            const videoTrackPub = Array.from(localParticipant.trackPublications.values()).find(
                (pub) => pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera && pub.videoTrack
            );

            if (!videoTrackPub || !videoTrackPub.videoTrack) {
                return;
            }

            videoTrackPub.videoTrack.setPublishingQuality(quality);
        },
        [localParticipant]
    );

    return setQuality;
}
