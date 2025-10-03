import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { RemoteTrackPublication } from '@proton-meet/livekit-client';
import { RoomEvent, Track } from '@proton-meet/livekit-client';

export const useParticipantAudioControls = () => {
    const room = useRoomContext();

    useEffect(() => {
        // Subscribing to the audio tracks of the remote participants upon joining the room
        room.remoteParticipants.forEach((rp) => {
            rp.audioTrackPublications.forEach((pub) => pub.setSubscribed(true));
            rp.getTrackPublication(Track.Source.ScreenShareAudio)?.setSubscribed(true);
        });

        const handleAudioTrackSubscribed = (pub: RemoteTrackPublication) => {
            if (pub.source === Track.Source.Microphone || pub.source === Track.Source.ScreenShareAudio) {
                pub.setSubscribed(true);
            }
        };

        // Keep subscribing to new audio tracks upon publishing
        room.on(RoomEvent.TrackPublished, handleAudioTrackSubscribed);

        return () => {
            room.off(RoomEvent.TrackPublished, handleAudioTrackSubscribed);
        };
    }, [room]);
};
