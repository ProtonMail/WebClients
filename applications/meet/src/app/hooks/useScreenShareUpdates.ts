import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { RemoteParticipant, RemoteTrackPublication } from '@proton-meet/livekit-client';
import { Track } from '@proton-meet/livekit-client';

import { useMeetContext } from '../contexts/MeetContext';

export const useScreenShareUpdates = () => {
    const room = useRoomContext();

    const { stopScreenShare } = useMeetContext();

    const handleRemoteScreenSharePublication = (
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
    ) => {
        if (
            publication.kind === Track.Kind.Video &&
            publication.source === Track.Source.ScreenShare &&
            participant.identity !== room.localParticipant.identity
        ) {
            stopScreenShare();
        }
    };

    useEffect(() => {
        room.on('trackPublished', handleRemoteScreenSharePublication);

        return () => {
            room.off('trackPublished', handleRemoteScreenSharePublication);
        };
    }, []);
};
