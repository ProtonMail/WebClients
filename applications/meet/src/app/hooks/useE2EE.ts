import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';

export const useE2EE = () => {
    const room = useRoomContext();

    useEffect(() => {
        if (room) {
            void room.setE2EEEnabled(true);
        }
    }, [room]);
};
