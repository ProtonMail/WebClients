import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetContext } from '../contexts/MeetContext';

export const useParticipantNameMapUpdate = () => {
    const room = useRoomContext();

    const { getParticipants } = useMeetContext();

    useEffect(() => {
        room.on('participantConnected', getParticipants);

        return () => {
            room.off('participantConnected', getParticipants);
        };
    }, [room, getParticipants]);
};
