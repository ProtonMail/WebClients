/// <reference lib="webworker" />
import { createWorkerLogger } from '../../utils/workerLogger';
import { BackgroundPipeline, type PipelineBackground } from './BackgroundPipeline';
import type { PipelineWorkerEvent, PipelineWorkerRequest } from './pipelineProtocol';
import { SegmentationClient } from './segmentationClient';

declare const self: DedicatedWorkerGlobalScope;

// Not in the TypeScript DOM lib yet.
interface WorkerTrackApis {
    MediaStreamTrackProcessor?: new (init: { track: MediaStreamTrack }) => { readable: ReadableStream<VideoFrame> };
    VideoTrackGenerator?: new () => { writable: WritableStream<VideoFrame>; track: MediaStreamTrack };
}

const trackApis = self as unknown as WorkerTrackApis;

let pipeline: BackgroundPipeline | null = null;
let pipeAbort: AbortController | null = null;
let inputTrack: MediaStreamTrack | null = null;

let ownedBitmaps: ImageBitmap[] = [];
let latestBackground: PipelineBackground | null = null;

const post = (event: PipelineWorkerEvent, transfer: Transferable[] = []) => self.postMessage(event, transfer);

const logger = createWorkerLogger('pipelineWorker');

const closeBitmapsExcept = (keep: ImageBitmap | null) => {
    ownedBitmaps = ownedBitmaps.filter((bitmap) => {
        if (bitmap === keep) {
            return true;
        }
        bitmap.close();
        return false;
    });
};

const runPipe = (readable: ReadableStream<VideoFrame>, writable: WritableStream<VideoFrame>) => {
    const current = pipeline;
    if (!current) {
        void readable.cancel();
        return;
    }
    const abort = new AbortController();
    pipeAbort = abort;
    readable
        .pipeThrough(
            new TransformStream<VideoFrame, VideoFrame>({
                transform: (frame, controller) => current.transform(frame, controller),
                flush: () => current.drain(),
            })
        )
        .pipeTo(writable, { signal: abort.signal })
        .catch((error: unknown) => {
            // The main thread stops the generator on teardown before this worker sees 'destroy'.
            const isTeardown =
                abort.signal.aborted || (error instanceof DOMException && error.name === 'InvalidStateError');
            if (!isTeardown) {
                logger.error('[bg-processor] pipeline stream failed', error);
            }
        });
};

const handleInit = (msg: Extract<PipelineWorkerRequest, { type: 'init' }>) => {
    const created = new BackgroundPipeline(
        new OffscreenCanvas(msg.width, msg.height),
        new SegmentationClient(msg.segmenterPort),
        msg.config,
        {
            onApplied: () => post({ type: 'applied' }),
            onInitializationFailed: (error) => post({ type: 'initialization-failed', message: error.message }),
        },
        logger
    );
    try {
        created.init();
    } catch (error) {
        created.destroy();
        post({ type: 'init-failed', message: error instanceof Error ? error.message : String(error) });
        return;
    }
    created.setPageHidden(msg.pageHidden);
    pipeline = created;
    post({ type: 'ready' });
};

const handleAttachTrack = (track: MediaStreamTrack) => {
    const { MediaStreamTrackProcessor: Processor, VideoTrackGenerator: Generator } = trackApis;
    if (!Processor || !Generator || !pipeline) {
        track.stop();
        post({ type: 'attach-failed', message: 'Track processing is unavailable in this worker' });
        return;
    }
    try {
        inputTrack = track;
        const generator = new Generator();
        const { readable } = new Processor({ track });
        post({ type: 'track', track: generator.track }, [generator.track as unknown as Transferable]);
        runPipe(readable, generator.writable);
    } catch (error) {
        track.stop();
        inputTrack = null;
        post({ type: 'attach-failed', message: error instanceof Error ? error.message : String(error) });
    }
};

const handleSetBackground = async ({ id, background }: Extract<PipelineWorkerRequest, { type: 'set-background' }>) => {
    latestBackground = background;
    if (background.type === 'image') {
        ownedBitmaps.push(background.bitmap);
    }
    try {
        await pipeline?.setBackground(background);
        post({ type: 'background-done', id });
    } catch (error) {
        post({ type: 'background-done', id, error: error instanceof Error ? error.message : String(error) });
    } finally {
        if (latestBackground === background) {
            closeBitmapsExcept(background.type === 'image' ? background.bitmap : null);
        }
    }
};

const handleDestroy = () => {
    pipeAbort?.abort();
    pipeAbort = null;
    pipeline?.destroy();
    pipeline = null;
    inputTrack?.stop();
    inputTrack = null;
    closeBitmapsExcept(null);
    self.close();
};

self.onmessage = (event: MessageEvent<PipelineWorkerRequest>) => {
    const msg = event.data;
    switch (msg.type) {
        case 'init':
            handleInit(msg);
            break;
        case 'attach-streams':
            runPipe(msg.readable, msg.writable);
            break;
        case 'attach-track':
            handleAttachTrack(msg.track);
            break;
        case 'set-background':
            void handleSetBackground(msg);
            break;
        case 'set-input-state':
            if (msg.stopped) {
                inputTrack?.stop();
            } else if (inputTrack) {
                inputTrack.enabled = msg.enabled;
            }
            break;
        case 'set-segmenter':
            if (msg.port && !pipeline) {
                msg.port.close();
            }
            pipeline?.setSegmentation(msg.port ? new SegmentationClient(msg.port) : null);
            break;
        case 'set-enabled':
            pipeline?.setEnabled(msg.enabled);
            break;
        case 'set-page-hidden':
            pipeline?.setPageHidden(msg.hidden);
            break;
        case 'destroy':
            handleDestroy();
            break;
    }
};

post({
    type: 'capabilities',
    trackProcessing:
        typeof trackApis.MediaStreamTrackProcessor === 'function' &&
        typeof trackApis.VideoTrackGenerator === 'function',
});
