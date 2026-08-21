import type { AudioProcessorOptions, Track, TrackProcessor } from 'livekit-client';

export type AudioTrackProcessor = TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> & {
    /** Krisp can be toggled in place, models without these have to be detached and re-attached. */
    isEnabled?: () => boolean;
    setEnabled?: (enabled: boolean) => Promise<unknown>;
    /** Resolves once the model denoises. Before that, models that bypass emit the raw capture. */
    whenReady?: () => Promise<unknown>;
    /**
     * Unwires the model but keeps it loaded and idle, so a later `init` on the same AudioContext
     * re-attaches without paying for the model again. Models without it have to be re-created.
     */
    detach?: () => void;
};

/**
 * Abstraction over the noise cancellation backends.
 *
 * Models that return a processor from `createProcessor` run through the LiveKit AudioWorklet
 * pipeline. Models that return `null` signal that the caller should fall back to the browser's
 * native `noiseSuppression` MediaTrack constraint instead.
 */
export interface NoiseCancellationModel {
    readonly id: string;
    /** Sample rate the model needs on the AudioContext, undefined lets the browser pick its default. */
    readonly audioContextSampleRate?: number;
    /** Whether the model is the browser's native noise suppression implementation (not a processor). */
    readonly isNative: boolean;
    isSupported(): boolean;
    createProcessor(): AudioTrackProcessor | null;
}
