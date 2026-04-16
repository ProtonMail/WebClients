declare global {
    interface Navigator {
        audioSession?: {
            type: AudioSessionType;
        };
    }
}

type AudioSessionType = 'auto' | 'playback' | 'play-and-record' | 'transient' | 'transient-solo' | 'ambient';

export const isAudioSessionAvailable = (): boolean => {
    return typeof navigator !== 'undefined' && 'audioSession' in navigator && !!navigator.audioSession;
};

export const getAudioSessionType = (): AudioSessionType | null => {
    if (!isAudioSessionAvailable()) {
        return null;
    }
    return navigator.audioSession!.type;
};

export const setAudioSessionType = (type: AudioSessionType): void => {
    if (!isAudioSessionAvailable()) {
        return;
    }
    navigator.audioSession!.type = type;
};

/**
 * iOS Safari workaround to ensure correct device selection.
 *
 * On iOS Safari, getUserMedia({audio: true}) defaults to the built-in iPhone
 * microphone regardless of which audio device is currently selected by the user.
 * This can also cause incorrect audio routing where the mic from one device is used
 * but audio output goes to a different device.
 *
 * The workaround is to manipulate the audioSession.type before and after getUserMedia to kick
 * iOS into recognizing and using the correct external audio device (AirPods, wired
 * headset, etc.).
 *
 * @param getUserMediaFn - The function that calls getUserMedia and returns a promise
 * @returns Promise that resolves with the MediaStream
 */
export const withIOSAudioSessionWorkaround = async <T>(getUserMediaFn: () => Promise<T>): Promise<T> => {
    if (!isAudioSessionAvailable()) {
        return getUserMediaFn();
    }

    try {
        setAudioSessionType('auto');
        const result = await getUserMediaFn();
        setAudioSessionType('play-and-record');
        return result;
    } catch (error) {
        setAudioSessionType('auto');
        throw error;
    }
};
