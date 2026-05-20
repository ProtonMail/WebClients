import type { AudioProcessorOptions, Track, TrackProcessor } from 'livekit-client';

import { isMobile } from '@proton/shared/lib/helpers/browser';

export const isRNNoiseFilterSupported = (): boolean => {
    return !isMobile() && typeof AudioWorklet !== 'undefined';
};

// Detect WebAssembly SIMD support once, at module load. The byte sequence is a tiny
// WASM module that uses v128 — validates only on engines that implement SIMD.
const isWasmSimdSupported = (() => {
    try {
        return WebAssembly.validate(
            new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b, 0x03, 0x02,
                0x01, 0x00, 0x0a, 0x0a, 0x01, 0x08, 0x00, 0x41, 0x00, 0xfd, 0x0f, 0xfd, 0x62, 0x0b,
            ])
        );
    } catch {
        return false;
    }
})();

const workletFile = isWasmSimdSupported ? 'noiseSuppressorWorkletSimd.js' : 'noiseSuppressorWorklet.js';

// eslint-disable-next-line no-console
console.log('[rnnoise] worklet build selected', { simd: isWasmSimdSupported, file: workletFile });

export const preloadRNNoiseWorkletAsset = (): void => {
    fetch(`/assets/rnnoise/${workletFile}`).catch(() => {});
};

const noiseSuppressorWorkletName = 'noiseSuppressorWorklet';

const loadingContexts = new WeakMap<AudioContext, Promise<void>>();

const ensureWorkletLoaded = (ctx: AudioContext): Promise<void> => {
    const existing = loadingContexts.get(ctx);
    if (existing) {
        return existing;
    }
    const promise = ctx.audioWorklet.addModule(`/assets/rnnoise/${workletFile}`);
    loadingContexts.set(ctx, promise);
    return promise;
};

export const preloadRNNoiseWorklet = (ctx: AudioContext): void => {
    ensureWorkletLoaded(ctx).catch(() => {});
};

export const waitForRNNoiseWorklet = (ctx: AudioContext): Promise<void> => {
    return ensureWorkletLoaded(ctx);
};

export const RNNoiseFilter = (): TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> => {
    let currentAudioContext: AudioContext | undefined;
    let sourceNode: MediaStreamAudioSourceNode | undefined;
    let workletNode: AudioWorkletNode | undefined;
    let destinationNode: MediaStreamAudioDestinationNode | undefined;

    const teardown = () => {
        workletNode?.disconnect();
        sourceNode?.disconnect();
        destinationNode?.disconnect();
        workletNode = undefined;
        sourceNode = undefined;
        destinationNode = undefined;
    };

    const processor: TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> = {
        name: 'rnnoise',
        processedTrack: undefined,

        async init({ audioContext, track }) {
            if (!audioContext) {
                throw new Error('Cannot initialize RNNoise processor without an AudioContext');
            }

            teardown();
            currentAudioContext = audioContext;
            await ensureWorkletLoaded(audioContext);

            sourceNode = audioContext.createMediaStreamSource(new MediaStream([track]));
            workletNode = new AudioWorkletNode(audioContext, noiseSuppressorWorkletName, {
                outputChannelCount: [1],
            });
            destinationNode = audioContext.createMediaStreamDestination();

            sourceNode.connect(workletNode).connect(destinationNode);
            processor.processedTrack = destinationNode.stream.getAudioTracks()[0];
        },

        async restart(opts) {
            // LiveKit omits audioContext when restarting processors after a live microphone switch.
            const audioContext = opts.audioContext ?? currentAudioContext;

            if (!audioContext) {
                throw new Error('Cannot restart RNNoise processor without an AudioContext');
            }

            teardown();
            await processor.init({ ...opts, audioContext });
        },

        async destroy() {
            teardown();
            processor.processedTrack = undefined;
        },
    };

    return processor;
};
