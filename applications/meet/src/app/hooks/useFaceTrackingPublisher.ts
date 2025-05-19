import { useCallback, useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { type LocalVideoTrack, Track } from 'livekit-client';

import noop from '@proton/utils/noop';

interface UseFaceTrackingPublisherParameters {
    faceTrack: LocalVideoTrack | null;
    isFaceTrackingEnabled: boolean;
}

export const useFaceTrackingPublisher = ({ faceTrack, isFaceTrackingEnabled }: UseFaceTrackingPublisherParameters) => {
    const room = useRoomContext();

    const handlePublish = useCallback(async () => {
        if (!room || !faceTrack) {
            return;
        }

        if (room.state === 'connected') {
            const alreadyPublished = room.localParticipant
                .getTrackPublications()
                .some((pub) => pub.track === faceTrack);
            if (!alreadyPublished) {
                await room.localParticipant.publishTrack(faceTrack, {
                    name: 'face-tracking',
                    source: Track.Source.Camera,
                    simulcast: true,
                });
            }

            return noop;
        }

        const handleConnected = async () => {
            await room.localParticipant.publishTrack(faceTrack, {
                name: 'face-tracking',
                source: Track.Source.Camera,
                simulcast: true,
            });
        };
        room.on('connected', handleConnected);
        return () => {
            room.off('connected', handleConnected);
        };
    }, [room, faceTrack]);

    useEffect(() => {
        if (isFaceTrackingEnabled) {
            void handlePublish();
        }
    }, [handlePublish, isFaceTrackingEnabled]);
};
