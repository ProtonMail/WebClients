import { useEffect } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';

import { videoQualities } from '../constants';
import { useMeetContext } from '../contexts/MeetContext';

export const useResolutionInitialisation = () => {
    const { localParticipant } = useLocalParticipant();
    const room = useRoomContext();
    const { resolution, setResolution } = useMeetContext();

    useEffect(() => {
        if (resolution) {
            return;
        }

        if (room && localParticipant) {
            const videoPublications = Array.from(localParticipant.trackPublications.values()).filter(
                (pub) => pub.kind === 'video'
            );

            if (videoPublications.length > 0 && videoPublications[0].track) {
                const track = videoPublications[0].track.mediaStreamTrack;
                const settings = track.getSettings();

                if (settings.width && settings.height) {
                    setResolution(`${settings.width}x${settings.height}`);
                } else {
                    setResolution(`${videoQualities[0].value.width}x${videoQualities[0].value.height}`);
                }
            } else {
                setResolution(`${videoQualities[2].value.width}x${videoQualities[2].value.height}`);
            }
        }
    }, [room, localParticipant]);
};
