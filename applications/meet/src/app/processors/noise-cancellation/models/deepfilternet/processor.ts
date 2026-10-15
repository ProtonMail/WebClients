import { logger } from '@protontech/logger';
import {
    DEEPFILTERNET_SAMPLE_RATE,
    type DeepFilterNetAudioWorkletHandle,
    type LoadReport,
    createDeepFilterNetAudioWorklet,
} from '@workadventure/noise-suppression/deepfilternet';

import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import type { AudioTrackProcessor, CreateProcessorOptions } from '../../types';

export const isDeepFilterNetSupported = (isMobileEnabled: boolean): boolean => {
    return (isMobileEnabled || !isMobile()) && typeof AudioWorklet !== 'undefined';
};

export { DEEPFILTERNET_SAMPLE_RATE };

const SPEECH_ATTENUATION_DB = 25;
const PAUSE_ATTENUATION_DB = SPEECH_ATTENUATION_DB;

const SLOW_FRAME_RATIO_TO_REPORT = 0.1;

export const DeepFilterNetFilter = ({
    reportError,
    onDisabledForPerformance,
}: { reportError: ReportMeetError } & CreateProcessorOptions): AudioTrackProcessor => {
    let currentAudioContext: AudioContext | undefined;
    let sourceNode: MediaStreamAudioSourceNode | undefined;
    let workletHandle: DeepFilterNetAudioWorkletHandle | undefined;
    let destinationNode: MediaStreamAudioDestinationNode | undefined;

    const disconnectNodes = () => {
        sourceNode?.disconnect();
        workletHandle?.node.disconnect();
        destinationNode?.disconnect();
        sourceNode = undefined;
        destinationNode = undefined;
    };

    const teardown = () => {
        disconnectNodes();
        workletHandle?.dispose();
        workletHandle = undefined;
    };

    const handleOverload = (load: number) => {
        onDisabledForPerformance?.();

        reportError('DeepFilterNet noise suppression not keeping up in real time', {
            level: 'warning',
            tags: {
                feature: 'noise-cancellation',
                deepFilterNetSeverity: 'overload',
            },
            context: {
                load: Number(load.toFixed(3)),
                hardwareConcurrency: navigator.hardwareConcurrency,
            },
        });
    };

    const reportSlowFrames = ({ slowFrames, frames, windows, medianLoad, p95Load, maxLoad }: LoadReport) => {
        const slowFrameRatio = frames > 0 ? slowFrames / frames : 0;

        const context = {
            slowFrames,
            frames,
            slowFrameRatio: Number(slowFrameRatio.toFixed(3)),
            windows,
            medianLoad: Number(medianLoad.toFixed(3)),
            p95Load: Number(p95Load.toFixed(3)),
            maxLoad: Number(maxLoad.toFixed(3)),
            hardwareConcurrency: navigator.hardwareConcurrency,
            deepFilterNetSlowFramesPercent: Math.floor(slowFrameRatio * 10) * 10,
        };

        if (slowFrameRatio < SLOW_FRAME_RATIO_TO_REPORT) {
            logger.info('DeepFilterNet noise suppression performance', context);
            return;
        }

        reportError('DeepFilterNet noise suppression had slow frames', {
            level: 'warning',
            tags: {
                feature: 'noise-cancellation',
                deepFilterNetSeverity: 'slow-frames',
                deepFilterNetSlowFramesPercent: context.deepFilterNetSlowFramesPercent,
            },
            context,
        });
    };

    const processor: AudioTrackProcessor = {
        name: 'deepfilternet-noise-suppression',
        processedTrack: undefined,

        whenReady: () => workletHandle?.ready ?? Promise.resolve(),

        detach: () => {
            disconnectNodes();
            processor.processedTrack = undefined;
        },

        async init({ audioContext, track }) {
            if (!audioContext) {
                throw new Error('Cannot initialize DeepFilterNet processor without an AudioContext');
            }

            const canReuseWorklet = !!workletHandle && currentAudioContext === audioContext;

            if (canReuseWorklet) {
                disconnectNodes();
            } else {
                teardown();
            }

            currentAudioContext = audioContext;

            sourceNode = audioContext.createMediaStreamSource(new MediaStream([track]));
            if (!workletHandle) {
                workletHandle = await createDeepFilterNetAudioWorklet(audioContext, {
                    bypassUntilReady: true,
                    speechAttenuationDb: SPEECH_ATTENUATION_DB,
                    pauseAttenuationDb: PAUSE_ATTENUATION_DB,
                    onOverload: handleOverload,
                    onLoadReport: reportSlowFrames,
                });
            }
            destinationNode = audioContext.createMediaStreamDestination();

            sourceNode.connect(workletHandle.node).connect(destinationNode);
            processor.processedTrack = destinationNode.stream.getAudioTracks()[0];
        },

        async restart(opts) {
            const audioContext = opts.audioContext ?? currentAudioContext;

            if (!audioContext) {
                throw new Error('Cannot restart DeepFilterNet processor without an AudioContext');
            }

            await processor.init({ ...opts, audioContext });
        },

        async destroy() {
            teardown();
            processor.processedTrack = undefined;
        },
    };

    return processor;
};
