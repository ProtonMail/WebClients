import { useCallback, useEffect } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { RemoteParticipant, RemoteTrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';

import { useCurrentScreenShare } from './useCurrentScreenShare';

export const useScreenShareUpdates = () => {
    const room = useRoomContext();

    const { localParticipant } = useLocalParticipant();
    const { stopScreenShare } = useCurrentScreenShare();

    const handleRemoteScreenSharePublication = useCallback(
        (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (
                publication.kind === Track.Kind.Video &&
                publication.source === Track.Source.ScreenShare &&
                participant.identity !== localParticipant.identity
            ) {
                stopScreenShare();
            }
        },
        [localParticipant, stopScreenShare]
    );

    useEffect(() => {
        room.on('trackPublished', handleRemoteScreenSharePublication);

        return () => {
            room.off('trackPublished', handleRemoteScreenSharePublication);
        };
    }, [stopScreenShare]);
};
