import type { AudioCaptureOptions, LocalParticipant, VideoCaptureOptions } from 'livekit-client';
import { ParticipantEvent, Track } from 'livekit-client';

type DeviceCapture =
    | { source: Track.Source.Camera; options?: VideoCaptureOptions }
    | { source: Track.Source.Microphone; options?: AudioCaptureOptions };

type DeviceSource = DeviceCapture['source'];

const pendingDeviceTracks = new WeakMap<LocalParticipant, Map<DeviceSource, Promise<boolean>>>();

/**
 * Resolves once the `enableDeviceTrack` call in flight for that source, if any, settled. LiveKit cannot see that call,
 * so a `setMicrophoneEnabled(true)` made meanwhile would open and publish a second track of the source. Resolves
 * `true` when that call stopped its track because the user left, so the device must not be opened again.
 */
export const waitForPendingDeviceTrack = async (localParticipant: LocalParticipant, source: DeviceSource) =>
    (await pendingDeviceTracks
        .get(localParticipant)
        ?.get(source)
        ?.catch(() => undefined)) === false;

const createAndPublish = async (
    localParticipant: LocalParticipant,
    capture: DeviceCapture,
    hasLeft: () => boolean
): Promise<boolean> => {
    const isCamera = capture.source === Track.Source.Camera;
    let tracks;
    try {
        tracks = await localParticipant.createTracks(
            isCamera ? { video: capture.options ?? true } : { audio: capture.options ?? true }
        );
    } catch (error) {
        if (hasLeft()) {
            return false;
        }
        if (error instanceof Error) {
            localParticipant.emit(ParticipantEvent.MediaDevicesError, error, isCamera ? 'videoinput' : 'audioinput');
        }
        throw error;
    }

    if (hasLeft()) {
        tracks.forEach((track) => track.stop());
        return false;
    }

    try {
        await Promise.all(tracks.map((track) => localParticipant.publishTrack(track)));
    } catch (error) {
        tracks.forEach((track) => track.stop());
        if (hasLeft()) {
            return false;
        }
        throw error;
    }
    return true;
};

/**
 * Same as `setCameraEnabled(true)` / `setMicrophoneEnabled(true)`, except that a track whose device answers after
 * the user left is stopped instead of published. LiveKit would keep that track, with the device on, until a reconnect
 * or its 15s publish timeout. Resolves `false` when the user left, whether the device answered or failed.
 */
export const enableDeviceTrack = async (
    localParticipant: LocalParticipant,
    capture: DeviceCapture,
    hasLeft: () => boolean
): Promise<boolean> => {
    const previous = waitForPendingDeviceTrack(localParticipant, capture.source);
    const publishing = (async () => {
        await previous;
        if (localParticipant.getTrackPublication(capture.source)) {
            if (capture.source === Track.Source.Camera) {
                await localParticipant.setCameraEnabled(true, capture.options);
            } else {
                await localParticipant.setMicrophoneEnabled(true, capture.options);
            }
            return true;
        }
        return createAndPublish(localParticipant, capture, hasLeft);
    })();

    const pending = pendingDeviceTracks.get(localParticipant) ?? new Map<DeviceSource, Promise<boolean>>();
    pendingDeviceTracks.set(localParticipant, pending);
    pending.set(capture.source, publishing);
    try {
        return await publishing;
    } finally {
        if (pending.get(capture.source) === publishing) {
            pending.delete(capture.source);
        }
    }
};
