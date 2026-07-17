import type { Room } from 'livekit-client';
import { LocalVideoTrack, Track } from 'livekit-client';

// Fallback matches the largest capture/simulcast resolution used by the app (h1080)
const FALLBACK_RESOLUTION = { width: 1920, height: 1080 };

// WeakSet avoids mutating the track object and lets the entry disappear once the track is garbage collected
const dummyVideoTracks = new WeakSet<LocalVideoTrack>();

export const createDummyVideoTrack = (room: Room): LocalVideoTrack | null => {
    const resolution = room.options?.videoCaptureDefaults?.resolution ?? FALLBACK_RESOLUTION;

    const canvas = document.createElement('canvas');
    canvas.width = resolution.width;
    canvas.height = resolution.height;

    const context = canvas.getContext('2d');
    if (context) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    // A low frame rate is enough: the track is published muted, so no frames are sent
    const [mediaStreamTrack] = canvas.captureStream(1).getVideoTracks();
    if (!mediaStreamTrack) {
        return null;
    }

    // userProvidedTrack = true so LiveKit never reacquires the canvas, which would open the real camera
    const track = new LocalVideoTrack(mediaStreamTrack, undefined, true);
    track.source = Track.Source.Camera;
    dummyVideoTracks.add(track);

    return track;
};

export const isDummyVideoTrack = (track?: LocalVideoTrack | null): boolean => !!track && dummyVideoTracks.has(track);

export const markVideoTrackDeviceBacked = (track: LocalVideoTrack): void => {
    dummyVideoTracks.delete(track);
    (track as unknown as { providedByUser: boolean }).providedByUser = false;
};
