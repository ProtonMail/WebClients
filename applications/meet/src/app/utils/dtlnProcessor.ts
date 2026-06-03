import {
    type NoiseSuppressionAudioWorkletHandle,
    createNoiseSuppressionAudioWorklet,
} from '@workadventure/noise-suppression/audio-worklet';
import type { AudioProcessorOptions, Track, TrackProcessor } from 'livekit-client';

import { isMobile } from '@proton/shared/lib/helpers/browser';

export const isDTLNFilterSupported = (): boolean => {
    return !isMobile() && typeof AudioWorklet !== 'undefined';
};

/** DTLN model is trained on 16 kHz audio — use this sample rate for the AudioContext. */
export const DTLN_AUDIO_CONTEXT_SAMPLE_RATE = 16000;

export const DTLNFilter = (): TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> => {
    let currentAudioContext: AudioContext | undefined;
    let sourceNode: MediaStreamAudioSourceNode | undefined;
    let workletHandle: NoiseSuppressionAudioWorkletHandle | undefined;
    let destinationNode: MediaStreamAudioDestinationNode | undefined;

    const teardown = () => {
        workletHandle?.dispose();
        sourceNode?.disconnect();
        destinationNode?.disconnect();
        workletHandle = undefined;
        sourceNode = undefined;
        destinationNode = undefined;
    };

    const processor: TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> = {
        name: 'dtln-noise-suppression',
        processedTrack: undefined,

        async init({ audioContext, track }) {
            if (!audioContext) {
                throw new Error('Cannot initialize DTLN processor without an AudioContext');
            }

            teardown();
            currentAudioContext = audioContext;

            sourceNode = audioContext.createMediaStreamSource(new MediaStream([track]));
            // bypassUntilReady: raw mic audio passes through while LiteRT + DTLN warm up,
            // then the worklet swaps in the denoised stream once ready.
            workletHandle = await createNoiseSuppressionAudioWorklet(audioContext, {
                bypassUntilReady: true,
            });
            destinationNode = audioContext.createMediaStreamDestination();

            sourceNode.connect(workletHandle.node).connect(destinationNode);
            processor.processedTrack = destinationNode.stream.getAudioTracks()[0];
        },

        async restart(opts) {
            // LiveKit omits audioContext when restarting processors after a live microphone switch.
            const audioContext = opts.audioContext ?? currentAudioContext;

            if (!audioContext) {
                throw new Error('Cannot restart DTLN processor without an AudioContext');
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
