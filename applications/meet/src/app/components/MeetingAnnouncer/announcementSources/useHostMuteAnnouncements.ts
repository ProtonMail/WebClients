import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, Track } from 'livekit-client';

import { announcementMessages } from '../messages';
import { AnnouncementPriority } from '../types';
import { useAnnounce } from '../useAnnounce';

// `remoteMute` fires only for host/server-forced mutes, unlike the generic `TrackMuted`.
// The engine is swapped on a full reconnect, so we rebind then.
export const useHostMuteAnnouncements = () => {
    const announce = useAnnounce();

    const room = useRoomContext();

    useEffect(() => {
        if (!room) {
            return;
        }

        const handleRemoteMute = (trackSid: string, muted: boolean) => {
            if (!muted) {
                return;
            }

            const publication = room.localParticipant.trackPublications.get(trackSid);

            if (publication?.source === Track.Source.Microphone) {
                announce(announcementMessages.mutedByHost(), {
                    dedupeKey: 'muted-by-host',
                    priority: AnnouncementPriority.High,
                });
                return;
            }

            if (publication?.source === Track.Source.Camera) {
                announce(announcementMessages.cameraDisabledByHost(), {
                    dedupeKey: 'camera-disabled-by-host',
                    priority: AnnouncementPriority.High,
                });
            }
        };

        let engine = room.engine;
        engine?.on('remoteMute', handleRemoteMute);

        const rebindToEngine = () => {
            if (room.engine === engine) {
                return;
            }
            engine?.off('remoteMute', handleRemoteMute);
            engine = room.engine;
            engine?.on('remoteMute', handleRemoteMute);
        };

        room.on(RoomEvent.Reconnected, rebindToEngine);

        return () => {
            room.off(RoomEvent.Reconnected, rebindToEngine);
            engine?.off('remoteMute', handleRemoteMute);
        };
    }, [room, announce]);
};
