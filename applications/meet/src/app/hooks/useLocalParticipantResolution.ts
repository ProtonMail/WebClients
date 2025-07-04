import { useCallback } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { VideoQuality } from 'livekit-client';

import { heightToVideoQuality } from '../constants';
import { useMeetContext } from '../contexts/MeetContext';

export const useLocalParticipantResolution = () => {
    const { localParticipant } = useLocalParticipant();
    const { setQuality, resolution, setResolution, videoDeviceId } = useMeetContext();

    const handleResolutionChange = useCallback(
        async (value: string) => {
            setResolution(value);
            const [width, height] = value.split('x').map(Number);

            const videoTrackPub = Array.from(localParticipant.trackPublications.values()).find(
                (pub) => pub.kind === Track.Kind.Video && pub.videoTrack
            );

            if (videoTrackPub && videoTrackPub.videoTrack && videoDeviceId) {
                await videoTrackPub.videoTrack.restartTrack({
                    deviceId: videoDeviceId,
                    resolution: { width, height },
                });
            }

            const livekitQuality = heightToVideoQuality[height] ?? VideoQuality.HIGH;

            setQuality(livekitQuality);
        },
        [videoDeviceId, localParticipant, setQuality, setResolution]
    );

    return { resolution, handleResolutionChange };
};
