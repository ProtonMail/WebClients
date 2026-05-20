import { useEffect } from 'react';

import { RemoteTrackPublication, type Room, RoomEvent, Track } from 'livekit-client';

interface UseTrackPublishedSubscriberOptions {
    enabled: boolean;
    room: Room;
}

// While recording, we need every camera/screen-share track subscribed even if
// the local UI wouldn't otherwise subscribe to it (off-screen participants,
// late joiners). This hook walks the current remote participants on enable
// and listens for `TrackPublished` so newcomers get subscribed too.
export const useTrackPublishedSubscriber = ({ enabled, room }: UseTrackPublishedSubscriberOptions) => {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        for (const participant of room.remoteParticipants.values()) {
            for (const publication of participant.trackPublications.values()) {
                if (
                    publication instanceof RemoteTrackPublication &&
                    (publication.source === Track.Source.Camera || publication.source === Track.Source.ScreenShare) &&
                    !publication.isSubscribed
                ) {
                    publication.setSubscribed(true);
                    publication.setEnabled(true);
                }
            }
        }

        const handleTrackPublished = (publication: RemoteTrackPublication) => {
            if (publication.source === Track.Source.Camera || publication.source === Track.Source.ScreenShare) {
                publication.setSubscribed(true);
                publication.setEnabled(true);
            }
        };

        room.on(RoomEvent.TrackPublished, handleTrackPublished);

        return () => {
            room.off(RoomEvent.TrackPublished, handleTrackPublished);
        };
    }, [enabled, room]);
};
