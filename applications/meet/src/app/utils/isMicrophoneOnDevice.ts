import { logger } from '@protontech/logger';
import type { LocalAudioTrack } from 'livekit-client';

const getConstrainedDeviceId = (constraint: ConstrainDOMString | undefined) => {
    const value =
        typeof constraint === 'object' && !Array.isArray(constraint)
            ? (constraint.exact ?? constraint.ideal)
            : constraint;
    return typeof value === 'string' ? value : undefined;
};

/**
 * LiveKit restarts the capture on every audioinput switch, even to the device already in use, and on a
 * muted track it defers that restart to the next unmute, where the fresh echo canceller leaks echo until
 * it adapts. The store can disagree with the track, so the track decides.
 */
export const isMicrophoneOnDevice = async (track: LocalAudioTrack, deviceId: string) => {
    // LiveKit writes it before restarting, so it also names a switch deferred while muted or one that failed
    const requestedId = getConstrainedDeviceId(track.constraints.deviceId);

    if (requestedId !== undefined && requestedId !== deviceId) {
        return false;
    }

    // Normalised: a capture opened without a deviceId reports 'default', never the id toggles resolve.
    // Resolving it enumerates devices, which can throw; switching anyway costs one restart at most.
    try {
        return (await track.getDeviceId()) === deviceId;
    } catch (error) {
        logger.warn('[isMicrophoneOnDevice] could not resolve the captured device', error, { deviceId });
        return false;
    }
};
