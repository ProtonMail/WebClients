import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';

import type { AudioTapSamples } from '../mediaEncoder/types';
import { forwardWorkerLog } from '../workerLogger';
import { CANVAS_HEIGHT, CANVAS_WIDTH, RECORDING_FPS } from './constants';
import { type TrackCapture, startTrackCapture } from './trackCapture';
import { type RecordingTrackInfo, type SceneState, VideoMixerMessageType } from './types';

interface VideoMixerClientOptions {
    initialScene: SceneState;
    reportMeetError: ReportMeetError;
    width?: number;
    height?: number;
    recordingFps?: number;
}

// Owns the recording canvas, the render worker and the lifecycle of every
// per-participant frame capture. The hook only ever talks to this class:
// `updateScene` for layout/state changes, `updateRecordedTracks` for the set
// of camera/screen-share tracks to capture.
export class VideoMixerClient {
    private worker: Worker;
    private canvas: HTMLCanvasElement;
    private canvasStream: MediaStream;
    private trackCaptures: Map<string, TrackCapture> = new Map();
    private reportMeetError: ReportMeetError;
    private encoderOnChunk: ((data: Uint8Array<ArrayBuffer>, position: number) => void) | null = null;
    private encoderDoneResolve: (() => void) | null = null;

    constructor({
        initialScene,
        reportMeetError,
        width = CANVAS_WIDTH,
        height = CANVAS_HEIGHT,
        recordingFps = RECORDING_FPS,
    }: VideoMixerClientOptions) {
        this.reportMeetError = reportMeetError;

        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvasStream = this.canvas.captureStream(recordingFps);

        this.worker = new Worker(new URL('./worker/worker.ts', import.meta.url), {
            type: 'module',
        });

        this.worker.onmessage = (event: MessageEvent) => {
            if (forwardWorkerLog(event.data)) {
                return;
            }

            const message = event.data;
            if (message?.type === 'encoderChunk') {
                this.encoderOnChunk?.(message.data, message.position);
            } else if (message?.type === 'encoderDone') {
                this.encoderDoneResolve?.();
                this.encoderDoneResolve = null;
            }
        };

        this.worker.onerror = (event) => {
            // eslint-disable-next-line no-console
            console.error('[MeetingRecorder/renderWorker] uncaught error in worker:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
            });
            this.reportMeetError('MeetingRecording Error: renderWorker uncaught error', {
                context: {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                },
            });

            // Unblock a pending stopEncoder so stop() doesn't hang on a dead worker.
            this.encoderDoneResolve?.();
            this.encoderDoneResolve = null;
        };

        const offscreen = this.canvas.transferControlToOffscreen();
        this.worker.postMessage(
            {
                type: VideoMixerMessageType.INIT,
                canvas: offscreen,
                state: initialScene,
            },
            [offscreen]
        );
        this.worker.postMessage({ type: VideoMixerMessageType.RENDER });
    }

    public updateScene(scene: SceneState): void {
        this.worker.postMessage({
            type: VideoMixerMessageType.UPDATE_STATE,
            state: scene,
        });
    }

    // Reconciles the active set of frame captures against the requested tracks.
    // Tracks that disappeared are stopped; new tracks get a fresh capture.
    public updateRecordedTracks(tracks: RecordingTrackInfo[]): void {
        const requestedIds = new Set<string>();

        tracks.forEach((trackInfo) => {
            const trackId = trackInfo.track?.sid;
            if (!trackId || !trackInfo.track || trackInfo.track.isMuted) {
                return;
            }

            requestedIds.add(trackId);

            if (this.trackCaptures.has(trackId)) {
                return;
            }

            const capture = startTrackCapture({ worker: this.worker, trackInfo });
            if (capture) {
                this.trackCaptures.set(capture.trackId, capture);
            }
        });

        this.trackCaptures.forEach((capture, trackId) => {
            if (!requestedIds.has(trackId)) {
                capture.stop();
                this.trackCaptures.delete(trackId);
            }
        });
    }

    public getVideoTracks(): MediaStreamTrack[] {
        return this.canvasStream.getVideoTracks();
    }

    public startEncoder(onChunk: (data: Uint8Array<ArrayBuffer>, position: number) => void): void {
        this.encoderOnChunk = onChunk;
        this.worker.postMessage({ type: VideoMixerMessageType.START_ENCODER });
    }

    public stopEncoder(): Promise<void> {
        return new Promise((resolve) => {
            this.encoderDoneResolve = resolve;
            this.worker.postMessage({ type: VideoMixerMessageType.STOP_ENCODER });
        });
    }

    public provideAudioSamples(samples: AudioTapSamples): void {
        this.worker.postMessage({ type: VideoMixerMessageType.PROVIDE_AUDIO_SAMPLES, samples });
    }

    public cleanup(): void {
        this.trackCaptures.forEach((capture) => capture.stop());
        this.trackCaptures.clear();

        this.worker.postMessage({ type: VideoMixerMessageType.STOP });
        this.worker.terminate();

        this.canvasStream.getTracks().forEach((track) => track.stop());
    }
}
