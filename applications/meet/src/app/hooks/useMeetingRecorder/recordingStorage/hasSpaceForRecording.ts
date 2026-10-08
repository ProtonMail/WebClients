import { ENCODER_AUDIO_BITRATE, ENCODER_VIDEO_BITRATE } from '../mediaEncoder/constants';

const MINIMUM_RECORDING_SECONDS = 10;

const MINIMUM_RECORDING_BYTES = ((ENCODER_VIDEO_BITRATE + ENCODER_AUDIO_BITRATE) / 8) * MINIMUM_RECORDING_SECONDS;

// Refuses to start a recording that could not hold 10 seconds of footage. The estimate is
// advisory and shared with the rest of the origin, so a full disk is still handled while recording.
export const hasSpaceForRecording = async (): Promise<boolean> => {
    if (!navigator.storage?.estimate) {
        return true;
    }

    try {
        const { quota = 0, usage = 0 } = await navigator.storage.estimate();
        return quota - usage > MINIMUM_RECORDING_BYTES;
    } catch {
        return true;
    }
};
