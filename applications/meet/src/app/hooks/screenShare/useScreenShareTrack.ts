import { useState } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { findScreenShare } from '../../utils/findScreenShare';
import { useScreenShareRoomEvents } from './useScreenShareRoomEvents';

export const useScreenShareTrack = () => {
    const room = useRoomContext();

    const [screenShareTrack, setScreenShareTrack] = useState(() => findScreenShare(room)?.track);

    useScreenShareRoomEvents(() => setScreenShareTrack(findScreenShare(room)?.track));

    return screenShareTrack;
};
