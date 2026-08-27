import { isFirefox, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';

export const supportsSetSinkId = () => {
    if (!document || isSafari() || isMobile() || isFirefox()) {
        return false;
    }

    return 'setSinkId' in document.createElement('audio');
};

/** `sinkId` is Chrome 110+ and not yet in the TypeScript lib types. */
export type AudioContextOptionsWithSinkId = AudioContextOptions & { sinkId?: { type: 'none' } };

/**
 * Options for an AudioContext that processes audio without ever acquiring an output device, so it
 * cannot compete with the playback context for Chrome's echo cancellation reference.
 */
export const outputlessAudioContextOptions = (options: AudioContextOptions = {}): AudioContextOptionsWithSinkId =>
    typeof AudioContext !== 'undefined' && 'setSinkId' in AudioContext.prototype
        ? { ...options, sinkId: { type: 'none' } }
        : options;
