import {
    type NoiseSuppressionAudioWorkletBenchmarkCompleteMessage,
    type NoiseSuppressionAudioWorkletHandle,
    createNoiseSuppressionAudioWorklet,
    runNoiseSuppressionAudioWorkletBenchmark,
} from '@workadventure/noise-suppression/audio-worklet';

import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import type { AudioTrackProcessor } from '../../types';

export const isDTLNFilterSupported = (): boolean => {
    return !isMobile() && typeof AudioWorklet !== 'undefined';
};

/** DTLN model is trained on 16 kHz audio — use this sample rate for the AudioContext. */
export const DTLN_AUDIO_CONTEXT_SAMPLE_RATE = 16000;

/** One DTLN frame is 512 samples at 16 kHz; denoising must finish within this to keep up in real time. */
const DTLN_FRAME_SAMPLES = 512;
const DTLN_FRAME_BUDGET_MS = (DTLN_FRAME_SAMPLES / DTLN_AUDIO_CONTEXT_SAMPLE_RATE) * 1000; // 32 ms

const DTLN_FIELD_SAMPLE_GAP_MS = 3000;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('dtln-perf-timeout')), ms);
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        clearTimeout(timer!);
    }
};

const DTLN_SENTRY_THROTTLE_MS = 5 * 60 * 1000;
let dtlnLastSentryReportAt = 0;
let dtlnOverBudgetWindowsSinceReport = 0;

const reportDtlnOverBudgetToSentry = (
    summary: NoiseSuppressionAudioWorkletBenchmarkCompleteMessage['summary'],
    reportError: ReportMeetError
) => {
    if (summary.meanMs <= DTLN_FRAME_BUDGET_MS) {
        return;
    }
    dtlnOverBudgetWindowsSinceReport += 1;

    const now = Date.now();
    if (now - dtlnLastSentryReportAt < DTLN_SENTRY_THROTTLE_MS) {
        return;
    }

    const context = {
        meanMs: Number(summary.meanMs.toFixed(2)),
        p95Ms: Number(summary.p95Ms.toFixed(2)),
        maxMs: Number(summary.maxMs.toFixed(2)),
        minMs: Number(summary.minMs.toFixed(2)),
        frameBudgetMs: DTLN_FRAME_BUDGET_MS,
        framesSampled: summary.count,
        overBudgetWindowsSinceLastReport: dtlnOverBudgetWindowsSinceReport,
        hardwareConcurrency: navigator.hardwareConcurrency,
    };

    reportError('DTLN noise suppression not keeping up in real time', {
        level: 'warning',
        tags: {
            feature: 'noise-cancellation',
            dtlnSeverity: 'underflow',
        },
        context,
    });

    // eslint-disable-next-line no-console
    console.warn('DTLN noise suppression not keeping up in real time', context);

    dtlnLastSentryReportAt = now;
    dtlnOverBudgetWindowsSinceReport = 0;
};

export const DTLNFilter = ({
    isDtlnPerfMonitorEnabled,
    reportError,
}: {
    isDtlnPerfMonitorEnabled: boolean;
    reportError: ReportMeetError;
}): AudioTrackProcessor => {
    let currentAudioContext: AudioContext | undefined;
    let sourceNode: MediaStreamAudioSourceNode | undefined;
    let workletHandle: NoiseSuppressionAudioWorkletHandle | undefined;
    let destinationNode: MediaStreamAudioDestinationNode | undefined;
    let perfMonitorActive = false;

    /**
     * Unwires the graph but keeps the worklet, so the loaded model can be re-used. Disconnecting
     * the worklet output also stops it being pulled, so it runs no inference while detached.
     */
    const disconnectNodes = () => {
        perfMonitorActive = false;
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

    const startPerfMonitor = () => {
        if (perfMonitorActive || !workletHandle || !isDtlnPerfMonitorEnabled) {
            return;
        }
        const handle = workletHandle;
        perfMonitorActive = true;
        if (isDtlnPerfMonitorEnabled) {
            // eslint-disable-next-line no-console
            console.log('[DTLN] perf monitor attached — logging per-frame timings');
        }
        void (async () => {
            while (perfMonitorActive && workletHandle === handle) {
                try {
                    const { summary } = await withTimeout(
                        runNoiseSuppressionAudioWorkletBenchmark(handle, {
                            warmupIterations: 0,
                            benchmarkIterations: 60,
                        }),
                        6000
                    );

                    if (!perfMonitorActive || workletHandle !== handle) {
                        break;
                    }

                    reportDtlnOverBudgetToSentry(summary, reportError);
                } catch {
                    // eslint-disable-next-line no-console
                    console.log('[DTLN] perf sample skipped — no audio reaching the worklet, or the round timed out');
                }

                await delay(DTLN_FIELD_SAMPLE_GAP_MS);
            }
        })();
    };

    const processor: AudioTrackProcessor = {
        name: 'dtln-noise-suppression',
        processedTrack: undefined,

        // Until this resolves the worklet is bypassed, so the audio is still the raw capture.
        whenReady: () => workletHandle?.ready ?? Promise.resolve(),

        detach: () => {
            disconnectNodes();
            processor.processedTrack = undefined;
        },

        async init({ audioContext, track }) {
            if (!audioContext) {
                throw new Error('Cannot initialize DTLN processor without an AudioContext');
            }

            // Re-attaching on the same context re-uses the worklet: LiteRT caches its runtime per
            // worklet scope, but each new worklet node recompiles the models, which costs seconds.
            const canReuseWorklet = !!workletHandle && currentAudioContext === audioContext;

            if (canReuseWorklet) {
                disconnectNodes();
            } else {
                teardown();
            }

            currentAudioContext = audioContext;

            sourceNode = audioContext.createMediaStreamSource(new MediaStream([track]));
            if (!workletHandle) {
                // bypassUntilReady: raw mic audio passes through while LiteRT + DTLN warm up,
                // then the worklet swaps in the denoised stream once ready.
                workletHandle = await createNoiseSuppressionAudioWorklet(audioContext, {
                    bypassUntilReady: true,
                });
            }
            destinationNode = audioContext.createMediaStreamDestination();

            sourceNode.connect(workletHandle.node).connect(destinationNode);
            processor.processedTrack = destinationNode.stream.getAudioTracks()[0];

            startPerfMonitor();
        },

        async restart(opts) {
            // LiveKit omits audioContext when restarting processors after a live microphone switch.
            const audioContext = opts.audioContext ?? currentAudioContext;

            if (!audioContext) {
                throw new Error('Cannot restart DTLN processor without an AudioContext');
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
