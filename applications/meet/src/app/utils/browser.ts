import { isFirefox, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';

export const supportsAudioContextSinkId = () =>
    typeof AudioContext !== 'undefined' && 'setSinkId' in AudioContext.prototype;

export const supportsElementSinkId = () => 'setSinkId' in document.createElement('audio');

export const supportsSetSinkId = () => {
    if (isSafari() || isMobile() || isFirefox()) {
        return false;
    }

    return supportsAudioContextSinkId();
};

/** `sinkId` is Chrome 110+ and not yet in the TypeScript lib types. */
export type AudioContextOptionsWithSinkId = AudioContextOptions & { sinkId?: { type: 'none' } };

/**
 * Options for an AudioContext that processes audio without ever acquiring an output device, so it
 * cannot compete with the playback context for Chrome's echo cancellation reference.
 */
export const outputlessAudioContextOptions = (options: AudioContextOptions = {}): AudioContextOptionsWithSinkId =>
    supportsAudioContextSinkId() ? { ...options, sinkId: { type: 'none' } } : options;
