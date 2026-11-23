import type { LocalVideoTrack, Room } from 'livekit-client';
import { ConnectionState } from 'livekit-client';

import { getCurrentCameraTrack } from '../cameraTrack';
import { isDummyVideoTrack } from '../dummyVideoTrack';

// prioritizePerformance() publishes a single 360p, 15 fps layer that dynacast cannot pause, and LiveKit has no
// way to turn it off on that track: only a new camera track, so leaving the mode republishes the camera.
export const syncCameraPerformanceMode = async ({
    room,
    isPrioritized,
    prioritizedTracks,
    republishCamera,
}: {
    room: Room;
    isPrioritized: boolean;
    prioritizedTracks: WeakSet<LocalVideoTrack>;
    republishCamera: () => Promise<boolean>;
}) => {
    const track = getCurrentCameraTrack(room);
    if (room.state !== ConnectionState.Connected || !track?.sender || track.isMuted || isDummyVideoTrack(track)) {
        return;
    }

    if (isPrioritized && !prioritizedTracks.has(track)) {
        prioritizedTracks.add(track);
        await track.prioritizePerformance();
    } else if (!isPrioritized && prioritizedTracks.has(track)) {
        await republishCamera();
    }
};
