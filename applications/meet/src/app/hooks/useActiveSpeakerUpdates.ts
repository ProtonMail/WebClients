import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { type Participant, RoomEvent } from 'livekit-client';

import { useHandler } from '@proton/components/hooks/useHandler';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setActiveSpeakerIdentity } from '@proton/meet/store/slices/participants/participantsSlice';

/**
 * Empty payloads are ignored so the last speaker stays on screen instead of emptying out between sentences,
 * and the throttle keeps a crossed conversation from swapping the spotlight several times per second.
 */
export const useActiveSpeakerUpdates = () => {
    const room = useRoomContext();
    const dispatch = useMeetDispatch();

    const handleActiveSpeakersChanged = useHandler(
        (activeSpeakers: Participant[]) => {
            const loudestRemoteSpeaker = activeSpeakers.find((participant) => !participant.isLocal);

            if (loudestRemoteSpeaker) {
                dispatch(setActiveSpeakerIdentity(loudestRemoteSpeaker.identity));
            }
        },
        { throttle: 1000 }
    );

    useEffect(() => {
        room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);

        return () => {
            room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
        };
    }, [room, handleActiveSpeakersChanged]);
};
