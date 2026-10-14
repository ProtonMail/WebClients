import { ProcessorWrapper } from '@livekit/track-processors';
import { type LocalTrack, TrackEvent } from 'livekit-client';

import { logger } from '@proton/logger';
import { withTimeout } from '@proton/meet/utils/withTimeout';
import { isIos } from '@proton/shared/lib/helpers/browser';

import { BACKGROUND_IMAGE_DECODE_TIMEOUT_MS } from '../../utils/customBackgrounds/constants';
import { forwardWorkerLog } from '../../utils/forwardWorkerLog';
import type { PipelineBackground, PipelineConfig } from './BackgroundPipeline';
import type { PipelineWorkerEvent, PipelineWorkerRequest } from './pipelineProtocol';
import type { SegmenterHandle } from './segmenterHost';

const WORKER_STEP_TIMEOUT_MS = 5000;

// Lets a destroyed worker stop its tracks before it is terminated.
const WORKER_SHUTDOWN_GRACE_MS = 1000;

const DEFAULT_TRACK_SIZE = 300;

type WorkerEventType = PipelineWorkerEvent['type'];
type WorkerEventOf<T extends WorkerEventType> = Extract<PipelineWorkerEvent, { type: T }>;

export interface WorkerSessionOptions {
    track: MediaStreamTrack;
    localTrack?: LocalTrack;
    config: PipelineConfig;
    background: PipelineBackground;
    enabled: boolean;
    startSegmenter: () => Promise<SegmenterHandle>;
    onApplied: () => void;
    onInitializationFailed: (error: Error) => void;
}

export type WorkerSessionResult =
    | { session: WorkerSession; unusedSegmenter: null }
    // An already started segmenter is handed back so the fallback doesn't load the model twice.
    | { session: null; unusedSegmenter: SegmenterHandle | null };

/**
 * Runs the frame pipeline in a dedicated worker. Chromium transfers the main-thread track
 * processor streams; Safari transfers a track clone. iOS is excluded: its frames need
 * re-orienting through the <video> element.
 */
export class WorkerSession {
    processedTrack: MediaStreamTrack | null = null;

    private activeSegmenter: SegmenterHandle | null = null;

    private generator: MediaStreamTrackGenerator<VideoFrame> | null = null;

    private nextBackgroundId = 0;

    private backgroundRequests = new Map<number, { resolve: () => void; reject: (error: Error) => void }>();

    private eventWaiters = new Set<(event: PipelineWorkerEvent) => boolean>();

    private started = false;

    private destroyed = false;

    private abortStartup!: (error: Error) => void;

    private readonly startupAborted = new Promise<never>((_, reject) => {
        this.abortStartup = reject;
    });

    private readonly visibilityListener = () =>
        this.post({ type: 'set-page-hidden', hidden: document.visibilityState === 'hidden' });

    // LiveKit mutes by stopping or disabling the track, neither of which reaches the worker's clone.
    private readonly inputStateListener = () =>
        this.post({
            type: 'set-input-state',
            enabled: !this.options.localTrack?.isMuted,
            stopped: this.options.track.readyState === 'ended',
        });

    private constructor(
        private readonly worker: Worker,
        private readonly options: WorkerSessionOptions
    ) {
        this.startupAborted.catch(() => {
            // Only observed through waitFor()
        });
        worker.onmessage = (event: MessageEvent<PipelineWorkerEvent>) => {
            if (forwardWorkerLog(event.data)) {
                return;
            }

            this.handleEvent(event.data);
        };
        worker.onerror = (event: ErrorEvent) => {
            const error = new Error(`Background pipeline worker error: ${event.message}`);
            // During start-up the caller falls back to the main thread instead of failing.
            if (!this.started) {
                this.abortStartup(error);
                return;
            }
            logger.error('[bg-processor] pipeline worker error', error);
            options.onInitializationFailed(error);
        };
    }

    // Resolves without a session if the browser can't run the pipeline in a worker. Rejects if
    // the segmenter fails to start.
    static async create(options: WorkerSessionOptions): Promise<WorkerSessionResult> {
        if (isIos() || typeof OffscreenCanvas === 'undefined') {
            return { session: null, unusedSegmenter: null };
        }

        let worker: Worker;
        try {
            worker = new Worker(
                /* webpackChunkName: "background-pipeline-worker" */
                new URL('./pipeline.worker.ts', import.meta.url),
                { type: 'module' }
            );
        } catch {
            return { session: null, unusedSegmenter: null };
        }

        const session = new WorkerSession(worker, options);
        try {
            if (await session.start()) {
                session.started = true;
                return { session, unusedSegmenter: null };
            }
        } catch (error) {
            await session.destroy();
            throw error;
        }

        const unusedSegmenter = session.activeSegmenter;
        session.activeSegmenter = null;
        await session.destroy();
        return { session: null, unusedSegmenter };
    }

    get segmenter() {
        return this.activeSegmenter;
    }

    // Takes ownership of `segmenter`; null leaves the pipeline compositing against its last mask.
    replaceSegmenter(segmenter: SegmenterHandle | null) {
        if (this.destroyed) {
            segmenter?.terminate();
            return;
        }
        const previous = this.activeSegmenter;
        this.activeSegmenter = segmenter;
        if (segmenter) {
            const port = segmenter.connect();
            this.post({ type: 'set-segmenter', port }, [port]);
        } else {
            this.post({ type: 'set-segmenter', port: null });
        }
        if (previous !== segmenter) {
            previous?.terminate();
        }
    }

    setEnabled(enabled: boolean) {
        this.post({ type: 'set-enabled', enabled });
    }

    setBackground(background: PipelineBackground): Promise<void> {
        const id = ++this.nextBackgroundId;
        const done = new Promise<void>((resolve, reject) => {
            this.backgroundRequests.set(id, { resolve, reject });
            try {
                // Not transferred: the caller's cache keeps the bitmap.
                this.worker.postMessage({ type: 'set-background', id, background } satisfies PipelineWorkerRequest);
            } catch (error) {
                reject(error instanceof Error ? error : new Error('The background could not be sent to the worker'));
            }
        });
        return withTimeout(done, 'Background pipeline worker background', BACKGROUND_IMAGE_DECODE_TIMEOUT_MS).finally(
            () => this.backgroundRequests.delete(id)
        );
    }

    async destroy() {
        if (this.destroyed) {
            return;
        }
        this.destroyed = true;

        document.removeEventListener('visibilitychange', this.visibilityListener);
        this.options.localTrack?.off(TrackEvent.Muted, this.inputStateListener);
        this.options.localTrack?.off(TrackEvent.Unmuted, this.inputStateListener);

        const teardown = new Error('The background pipeline was destroyed');
        this.abortStartup(teardown);
        this.backgroundRequests.forEach(({ reject }) => reject(teardown));
        this.backgroundRequests.clear();
        this.eventWaiters.clear();

        this.post({ type: 'destroy' });
        const { worker } = this;
        setTimeout(() => worker.terminate(), WORKER_SHUTDOWN_GRACE_MS);
        worker.onmessage = null;
        worker.onerror = null;

        this.generator?.stop();
        this.generator = null;
        this.processedTrack?.stop();
        this.processedTrack = null;
        this.activeSegmenter?.terminate();
        this.activeSegmenter = null;
    }

    private async start(): Promise<boolean> {
        const capabilities = await this.waitFor('capabilities').catch(() => null);
        if (!capabilities) {
            return false;
        }

        let transport: 'streams' | 'track';
        if (ProcessorWrapper.hasModernApiSupport) {
            transport = 'streams';
        } else if (capabilities.trackProcessing) {
            transport = 'track';
        } else {
            return false;
        }

        const segmenter = await this.options.startSegmenter();
        if (this.destroyed) {
            segmenter.terminate();
            return false;
        }
        this.activeSegmenter = segmenter;

        const { track, config } = this.options;
        const settings = track.getSettings();
        const pageHidden = document.visibilityState === 'hidden';
        const segmenterPort = segmenter.connect();
        const ready = this.waitFor('ready', 'init-failed');
        this.post(
            {
                type: 'init',
                config,
                width: settings.width || DEFAULT_TRACK_SIZE,
                height: settings.height || DEFAULT_TRACK_SIZE,
                segmenterPort,
                pageHidden,
            },
            [segmenterPort]
        );
        const readiness = await ready.catch(() => null);
        if (readiness?.type !== 'ready') {
            return false;
        }

        if (config.pauseSegmentationWhenHidden) {
            document.addEventListener('visibilitychange', this.visibilityListener);
        }
        this.setEnabled(this.options.enabled);
        const hasBackground = await Promise.race([
            this.setBackground(this.options.background).then(() => true),
            this.startupAborted,
        ]).catch(() => false);
        if (!hasBackground) {
            return false;
        }

        this.processedTrack = transport === 'streams' ? this.attachStreams(track) : await this.attachTrack(track);
        return !!this.processedTrack;
    }

    private attachStreams(track: MediaStreamTrack): MediaStreamTrack | null {
        try {
            const videoTrack = track as MediaStreamVideoTrack;
            const processor = new MediaStreamTrackProcessor({ track: videoTrack });
            const generator = new MediaStreamTrackGenerator({ kind: 'video', signalTarget: videoTrack });
            this.post({ type: 'attach-streams', readable: processor.readable, writable: generator.writable }, [
                processor.readable,
                generator.writable,
            ]);
            this.generator = generator;
            return generator;
        } catch {
            return null;
        }
    }

    private async attachTrack(track: MediaStreamTrack): Promise<MediaStreamTrack | null> {
        const { localTrack } = this.options;
        const clone = track.clone();
        // The raw track may be briefly disabled while the processor attaches; don't copy that.
        clone.enabled = !localTrack?.isMuted;

        const reply = this.waitFor('track', 'attach-failed');
        try {
            this.post({ type: 'attach-track', track: clone }, [clone as unknown as Transferable]);
        } catch {
            clone.stop();
            return null;
        }
        const event = await reply.catch(() => null);
        if (event?.type !== 'track') {
            return null;
        }

        localTrack?.on(TrackEvent.Muted, this.inputStateListener);
        localTrack?.on(TrackEvent.Unmuted, this.inputStateListener);
        this.inputStateListener();
        return event.track;
    }

    private post(request: PipelineWorkerRequest, transfer: Transferable[] = []) {
        if (this.destroyed && request.type !== 'destroy') {
            return;
        }
        this.worker.postMessage(request, transfer);
    }

    private waitFor<T extends WorkerEventType>(...types: T[]): Promise<WorkerEventOf<T>> {
        let waiter!: (event: PipelineWorkerEvent) => boolean;
        const event = new Promise<WorkerEventOf<T>>((resolve) => {
            waiter = (candidate) => {
                if (!(types as WorkerEventType[]).includes(candidate.type)) {
                    return false;
                }
                resolve(candidate as WorkerEventOf<T>);
                return true;
            };
            this.eventWaiters.add(waiter);
        });
        return Promise.race([
            withTimeout(event, `Background pipeline worker ${types.join('/')}`, WORKER_STEP_TIMEOUT_MS),
            this.startupAborted,
        ]).finally(() => this.eventWaiters.delete(waiter));
    }

    private handleEvent(event: PipelineWorkerEvent) {
        if (!event) {
            return;
        }
        switch (event.type) {
            case 'applied':
                this.options.onApplied();
                return;
            case 'initialization-failed':
                this.options.onInitializationFailed(new Error(event.message));
                return;
            case 'background-done': {
                const request = this.backgroundRequests.get(event.id);
                this.backgroundRequests.delete(event.id);
                if (event.error) {
                    request?.reject(new Error(event.error));
                } else {
                    request?.resolve();
                }
                return;
            }
        }
        for (const waiter of this.eventWaiters) {
            if (waiter(event)) {
                this.eventWaiters.delete(waiter);
            }
        }
    }
}
