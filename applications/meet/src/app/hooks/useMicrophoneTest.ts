import { useCallback, useEffect, useRef, useState } from 'react';

import { Track } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { withTimeout } from '@proton/meet/utils/withTimeout';

import type { AudioTrackProcessor } from '../processors/noise-cancellation/types';
import { useNoiseCancellationModel } from '../processors/noise-cancellation/useNoiseCancellationModel';
import { supportsSetSinkId } from '../utils/browser';
import type { AnalyserSource } from './useAnalyserLevel';
import { useAnalyserLevel } from './useAnalyserLevel';

const LEVEL_UPDATE_THROTTLE_MS = 60;
/** Normal speech peaks well below a full scale RMS, so the meter is scaled to stay readable. */
const LEVEL_SCALE = 2.5;
const MAX_RECORDING_MS = 6_000;
const ELAPSED_UPDATE_MS = 200;
/** Loading LiteRT and compiling the DTLN model takes seconds on a cold start. */
const WARMUP_TIMEOUT_MS = 5_000;

type AudioContextWithSinkId = AudioContext & { setSinkId?: (sinkId: string) => Promise<void> };

export enum MicrophoneTestStatus {
    Idle = 'idle',
    Preparing = 'preparing',
    Recording = 'recording',
    Playing = 'playing',
}

export enum MicrophoneTestFailure {
    Permission = 'permission',
    NotFound = 'not-found',
    Busy = 'busy',
    Playback = 'playback',
    Unknown = 'unknown',
}

const getFailureReason = (error: unknown): MicrophoneTestFailure => {
    const name = error instanceof DOMException ? error.name : '';

    switch (name) {
        case 'NotAllowedError':
        case 'SecurityError':
            return MicrophoneTestFailure.Permission;
        case 'NotFoundError':
        case 'OverconstrainedError':
            return MicrophoneTestFailure.NotFound;
        // Firefox raises these when the device is already open with different processing constraints.
        case 'NotReadableError':
        case 'AbortError':
            return MicrophoneTestFailure.Busy;
        default:
            return MicrophoneTestFailure.Unknown;
    }
};

const NO_ANALYSIS: AnalyserSource = { analyser: null, dataArray: null };

/**
 * Kept alive between takes: loading the model costs seconds, and it is only re-used if both the
 * context and the processor survive.
 */
interface WarmPipeline {
    audioContext: AudioContext;
    processor: AudioTrackProcessor | null;
    modelId: string;
    /** False when the browser refused the rate the model needs, which rules the model out */
    hasModelSampleRate: boolean;
}

/** Belongs to a single take, released as soon as it ends. */
interface MicrophoneCapture {
    stream: MediaStream;
    source: MediaStreamAudioSourceNode;
    analyser: AnalyserNode;
    dataArray: Uint8Array<ArrayBuffer>;
    recorder: MediaRecorder;
    processor: AudioTrackProcessor | null;
}

interface RecordingPlayback {
    audioContext: AudioContextWithSinkId;
    source: AudioBufferSourceNode;
}

interface UseMicrophoneTestProps {
    /** `null` means the system default device */
    microphoneDeviceId: string | null;
    /** `null` means the system default device */
    speakerDeviceId: string | null;
    /** Mirrors the noise cancellation setting so the test sounds like the meeting will */
    noiseCancellationEnabled: boolean;
}

const getSupportedMimeType = () => {
    if (typeof MediaRecorder.isTypeSupported !== 'function') {
        return undefined;
    }

    // Opus in WebM everywhere except Safari, which only records into MP4.
    return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((mimeType) =>
        MediaRecorder.isTypeSupported(mimeType)
    );
};

/**
 * Records a short microphone sample and plays it back on the selected speaker. The microphone is
 * released before playback starts, so no acoustic feedback loop can form, and the capture uses its
 * own stream so the test works while the microphone is muted.
 */
export const useMicrophoneTest = ({
    microphoneDeviceId,
    speakerDeviceId,
    noiseCancellationEnabled,
}: UseMicrophoneTestProps) => {
    const noiseCancellationModel = useNoiseCancellationModel();
    const [status, setStatus] = useState<MicrophoneTestStatus>(MicrophoneTestStatus.Idle);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [failure, setFailure] = useState<MicrophoneTestFailure | null>(null);

    const { reportMeetError } = useMeetErrorReporting();

    const pipelineRef = useRef<WarmPipeline | null>(null);
    const captureRef = useRef<MicrophoneCapture | null>(null);
    const playbackRef = useRef<RecordingPlayback | null>(null);
    const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isStartingRef = useRef(false);
    const captureGenerationRef = useRef(0);
    const playbackGenerationRef = useRef(0);

    // Playback happens after the recorder stops, by then the selected speaker may have changed.
    const speakerDeviceIdRef = useRef(speakerDeviceId);
    speakerDeviceIdRef.current = speakerDeviceId;

    const level = useAnalyserLevel({
        getAnalysis: () => captureRef.current ?? NO_ANALYSIS,
        isActive: status === MicrophoneTestStatus.Recording,
        throttleMs: LEVEL_UPDATE_THROTTLE_MS,
        scale: LEVEL_SCALE,
    });

    const releaseCapture = useCallback((discardRecording = false) => {
        captureGenerationRef.current += 1;
        isStartingRef.current = false;

        if (maxDurationTimerRef.current) {
            clearTimeout(maxDurationTimerRef.current);
            maxDurationTimerRef.current = null;
        }

        if (elapsedTimerRef.current) {
            clearInterval(elapsedTimerRef.current);
            elapsedTimerRef.current = null;
        }

        const capture = captureRef.current;
        captureRef.current = null;
        setElapsedMs(0);

        if (!capture) {
            return;
        }

        if (discardRecording) {
            capture.recorder.onstop = null;
        }
        if (capture.recorder.state !== 'inactive') {
            capture.recorder.stop();
        }

        capture.source.disconnect();
        capture.stream.getTracks().forEach((track) => track.stop());

        // Detaching keeps the model warm for the next take, models that cannot detach get rebuilt.
        if (capture.processor?.detach) {
            capture.processor.detach();
        } else if (capture.processor) {
            void capture.processor.destroy().catch(() => undefined);
            if (pipelineRef.current) {
                pipelineRef.current.processor = null;
            }
        }
    }, []);

    /** Unloads the model and its context. The capture has to be released first. */
    const releasePipeline = useCallback(() => {
        const pipeline = pipelineRef.current;
        pipelineRef.current = null;

        if (pipeline) {
            void pipeline.processor?.destroy().catch(() => undefined);
            void pipeline.audioContext.close().catch(() => undefined);
        }
    }, []);

    const releasePlayback = useCallback(() => {
        playbackGenerationRef.current += 1;

        const playback = playbackRef.current;
        playbackRef.current = null;

        if (!playback) {
            return;
        }

        // Detached first: stop() fires onended, which would bounce straight back in here.
        playback.source.onended = null;
        try {
            playback.source.stop();
        } catch (error) {
            // Never started or already ended.
        }
        playback.source.disconnect();
        void playback.audioContext.close().catch(() => undefined);
    }, []);

    const stopTest = useCallback(() => {
        releaseCapture(true);
        releasePlayback();
        setStatus(MicrophoneTestStatus.Idle);
    }, [releaseCapture, releasePlayback]);

    // A recording kept across a device switch would be attributed to the wrong microphone.
    const testedMicrophoneIdRef = useRef(microphoneDeviceId);

    useEffect(() => {
        if (testedMicrophoneIdRef.current !== microphoneDeviceId) {
            testedMicrophoneIdRef.current = microphoneDeviceId;
            stopTest();
        }
    }, [microphoneDeviceId, stopTest]);

    // Joining closes the settings dropdown, so this also releases the devices before the meeting
    // takes them over, and the model with them: the meeting loads its own.
    useEffect(() => {
        return () => {
            releaseCapture(true);
            releasePlayback();
            releasePipeline();
        };
    }, [releaseCapture, releasePlayback, releasePipeline]);

    const playRecording = async (recording: Blob) => {
        if (recording.size === 0) {
            setStatus(MicrophoneTestStatus.Idle);
            return;
        }

        releasePlayback();

        const generation = playbackGenerationRef.current;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext: AudioContextWithSinkId = new AudioContextClass();

        if (supportsSetSinkId()) {
            try {
                await audioContext.setSinkId?.(speakerDeviceIdRef.current ?? '');
            } catch (error) {
                reportMeetError('Microphone test could not select the speaker', error);
            }
        }

        try {
            const buffer = await audioContext.decodeAudioData(await recording.arrayBuffer());

            if (audioContext.state === 'suspended') {
                await audioContext.resume().catch(() => undefined);
            }

            // Aborted while decoding: nothing may start playing behind the abort's back.
            if (generation !== playbackGenerationRef.current) {
                void audioContext.close().catch(() => undefined);
                return;
            }

            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.onended = () => {
                releasePlayback();
                setStatus(MicrophoneTestStatus.Idle);
            };

            playbackRef.current = { audioContext, source };
            setStatus(MicrophoneTestStatus.Playing);
            source.start();
        } catch (error) {
            void audioContext.close().catch(() => undefined);
            setStatus(MicrophoneTestStatus.Idle);
            setFailure(MicrophoneTestFailure.Playback);
            reportMeetError('Microphone test playback failed', error);
        }
    };

    const startRecording = async () => {
        if (isStartingRef.current || captureRef.current) {
            return;
        }

        isStartingRef.current = true;
        setFailure(null);
        releasePlayback();

        const generation = captureGenerationRef.current;

        const { isNative, audioContextSampleRate } = noiseCancellationModel;
        const useProcessor = noiseCancellationEnabled && !isNative;
        let acquiredStream: MediaStream | undefined;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    autoGainControl: true,
                    // Same split as the published track: the native constraint only denoises when
                    // no model runs, otherwise the model would process already processed audio.
                    noiseSuppression: isNative ? noiseCancellationEnabled : false,
                    ...(microphoneDeviceId ? { deviceId: { exact: microphoneDeviceId } } : {}),
                },
            });

            acquiredStream = stream;

            // A pipeline built for another model cannot be re-used.
            if (pipelineRef.current && pipelineRef.current.modelId !== noiseCancellationModel.id) {
                releasePipeline();
            }

            if (!pipelineRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioContext: AudioContextWithSinkId = new AudioContextClass(
                    audioContextSampleRate ? { sampleRate: audioContextSampleRate } : undefined
                );

                pipelineRef.current = {
                    audioContext,
                    processor: null,
                    modelId: noiseCancellationModel.id,
                    hasModelSampleRate: !audioContextSampleRate || audioContext.sampleRate === audioContextSampleRate,
                };
            }

            const pipeline = pipelineRef.current;
            const { audioContext } = pipeline;

            if (useProcessor && pipeline.hasModelSampleRate && !pipeline.processor) {
                pipeline.processor = noiseCancellationModel.createProcessor();
            }

            const processor = useProcessor && pipeline.hasModelSampleRate ? pipeline.processor : null;
            const capturedTrack = stream.getAudioTracks()[0];
            let recordedTrack: MediaStreamTrack = capturedTrack;

            if (processor) {
                await processor.init({ audioContext, track: capturedTrack, kind: Track.Kind.Audio });
                recordedTrack = processor.processedTrack ?? capturedTrack;
            }

            const recordedStream = recordedTrack === capturedTrack ? stream : new MediaStream([recordedTrack]);

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;

            // Reads what gets recorded, and only that: the capture never reaches the speakers.
            const source = audioContext.createMediaStreamSource(recordedStream);
            source.connect(analyser);

            if (audioContext.state === 'suspended') {
                await audioContext.resume().catch(() => undefined);
            }

            // Aborted while acquiring the device: drop the take, keep the pipeline warm.
            if (generation !== captureGenerationRef.current) {
                source.disconnect();
                processor?.detach?.();
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            const mimeType = getSupportedMimeType();
            const recorder = new MediaRecorder(recordedStream, mimeType ? { mimeType } : undefined);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                // recorder.mimeType is what was actually produced, which is what decoding needs.
                const recording = new Blob(chunks, { type: recorder.mimeType || mimeType });

                releaseCapture();
                // Before the recording is decoded, so a click during that window aborts the test
                // rather than reaching the recorder that was just released.
                setStatus(MicrophoneTestStatus.Playing);
                void playRecording(recording);
            };

            // Registered before the warm-up wait, so aborting during it releases the device at once.
            captureRef.current = {
                stream,
                source,
                analyser,
                dataArray: new Uint8Array(analyser.fftSize),
                recorder,
                processor,
            };

            // Recording before the model is ready would capture its raw passthrough audio, but a
            // model that never gets there is not worth blocking the test on.
            if (processor?.whenReady) {
                setStatus(MicrophoneTestStatus.Preparing);
                try {
                    await withTimeout(processor.whenReady(), 'Noise cancellation model warm-up', WARMUP_TIMEOUT_MS);
                } catch (error) {
                    reportMeetError('Microphone test recorded before the model was ready', error);
                }

                if (generation !== captureGenerationRef.current) {
                    return;
                }
            }

            recorder.start();
            setStatus(MicrophoneTestStatus.Recording);

            const startedAt = Date.now();
            elapsedTimerRef.current = setInterval(() => {
                setElapsedMs(Math.min(Date.now() - startedAt, MAX_RECORDING_MS));
            }, ELAPSED_UPDATE_MS);

            maxDurationTimerRef.current = setTimeout(() => {
                captureRef.current?.recorder.stop();
            }, MAX_RECORDING_MS);
        } catch (error) {
            releaseCapture(true);
            acquiredStream?.getTracks().forEach((track) => track.stop());
            setStatus(MicrophoneTestStatus.Idle);
            setFailure(getFailureReason(error));
            reportMeetError('Microphone test failed to start', error);
        } finally {
            if (generation === captureGenerationRef.current) {
                isStartingRef.current = false;
            }
        }
    };

    /** Test -> record, Stop recording -> play back, and a click during playback ends the test. */
    const toggleTest = () => {
        if (status === MicrophoneTestStatus.Recording) {
            captureRef.current?.recorder.stop();
            return;
        }

        // Preparing waits on the noise cancellation model, so a click means "give up on it".
        if (status === MicrophoneTestStatus.Preparing || status === MicrophoneTestStatus.Playing) {
            stopTest();
            return;
        }

        void startRecording();
    };

    return { status, level, failure, toggleTest, elapsedMs };
};
