import { TrackEvent } from 'livekit-client';
import type { LocalTrack, ProcessorOptions, Track } from 'livekit-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBackgroundProcessorHandle } from './BackgroundProcessor';
import { type SegmenterHandle, startSegmenter } from './segmenterHost';
import { WorkerSession, type WorkerSessionResult } from './workerSession';

vi.mock('./workerSession', () => ({
    WorkerSession: { create: vi.fn() },
}));

vi.mock('./segmenterHost', () => ({
    startSegmenter: vi.fn(),
    preloadBackgroundBlurAssets: vi.fn(),
}));

vi.mock('./createProcessorWrapper', () => ({
    createProcessorWrapper: () => ({ name: 'background-effect', init: vi.fn(), destroy: vi.fn() }),
}));

const createDeferred = <T>() => {
    let resolve!: (value: T) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<T>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return { promise, resolve, reject };
};

type FakeTrack = MediaStreamTrack & { stop: ReturnType<typeof vi.fn> };

const createFakeTrack = (label: string): FakeTrack =>
    ({
        label,
        stop: vi.fn(),
        getSettings: () => ({ width: 640, height: 480 }),
    }) as unknown as FakeTrack;

const createFakeLocalTrack = (sender: { track: MediaStreamTrack | null } | undefined) => {
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    return {
        sender,
        isMuted: false,
        on: (event: string, listener: (...args: unknown[]) => void) => {
            listeners.set(event, (listeners.get(event) ?? new Set()).add(listener));
        },
        off: (event: string, listener: (...args: unknown[]) => void) => {
            listeners.get(event)?.delete(listener);
        },
        emit: (event: string) => {
            [...(listeners.get(event) ?? [])].forEach((listener) => listener());
        },
    };
};

const createFakeSender = (track: MediaStreamTrack) => {
    const sender = {
        track: track as MediaStreamTrack | null,
        replaceTrack: vi.fn(async (next: MediaStreamTrack | null) => {
            await Promise.resolve();
            sender.track = next;
        }),
    };
    return sender;
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('BackgroundEffectProcessor loading track', () => {
    let loadingTracks: FakeTrack[];
    let loadingTrack: FakeTrack;
    let workerSession: ReturnType<typeof createDeferred<WorkerSessionResult>>;

    beforeEach(() => {
        loadingTracks = [];
        workerSession = createDeferred<WorkerSessionResult>();
        vi.mocked(WorkerSession.create).mockReturnValue(workerSession.promise);
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            fillRect: () => {},
            beginPath: () => {},
            arc: () => {},
            stroke: () => {},
        } as unknown as CanvasRenderingContext2D);
        Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', {
            configurable: true,
            value: () => {
                const track = createFakeTrack('loading');
                loadingTracks.push(track);
                loadingTrack = loadingTracks[0];
                return { getVideoTracks: () => [track] };
            },
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete (HTMLCanvasElement.prototype as { captureStream?: unknown }).captureStream;
    });

    const startInit = (sender: ReturnType<typeof createFakeSender> | undefined) => {
        const rawTrack = (sender?.track as MediaStreamTrack | undefined) ?? createFakeTrack('camera');
        const localTrack = createFakeLocalTrack(sender);
        const processor = createBackgroundProcessorHandle({});
        const options = {
            kind: 'video',
            track: rawTrack,
            localTrack: localTrack as unknown as LocalTrack,
        } as ProcessorOptions<Track.Kind.Video>;
        const init = processor.init(options);
        return { processor, init, rawTrack, localTrack, options };
    };

    const createSessionResult = (processedTrack: MediaStreamTrack): WorkerSessionResult =>
        ({
            session: { processedTrack, destroy: vi.fn(), setDebugView: vi.fn() },
            unusedSegmenter: null,
        }) as unknown as WorkerSessionResult;

    it('publishes the loading track while the processor initializes', async () => {
        const sender = createFakeSender(createFakeTrack('camera'));
        startInit(sender);
        await flush();

        expect(sender.track).toBe(loadingTrack);
        expect(loadingTrack.stop).not.toHaveBeenCalled();
    });

    it('leaves the processed track on the sender once LiveKit swaps it in', async () => {
        const sender = createFakeSender(createFakeTrack('camera'));
        const { init, localTrack } = startInit(sender);
        const processedTrack = createFakeTrack('processed');
        workerSession.resolve(createSessionResult(processedTrack));
        await init;
        await flush();
        expect(sender.track).toBe(loadingTrack);

        await sender.replaceTrack(processedTrack);
        localTrack.emit(TrackEvent.TrackProcessorUpdate);
        await flush();

        expect(sender.track).toBe(processedTrack);
        expect(loadingTrack.stop).toHaveBeenCalled();
    });

    it('restores the camera track when initialization fails', async () => {
        const sender = createFakeSender(createFakeTrack('camera'));
        const { init, rawTrack } = startInit(sender);
        await flush();

        workerSession.reject(new Error('The segmenter failed to start'));
        await expect(init).rejects.toThrow();
        await flush();

        expect(sender.track).toBe(rawTrack);
        expect(loadingTrack.stop).toHaveBeenCalled();
    });

    it('restores the camera track when the processor is destroyed while initializing', async () => {
        const sender = createFakeSender(createFakeTrack('camera'));
        const { processor, init, rawTrack } = startInit(sender);
        await flush();

        await processor.destroy();
        await flush();

        expect(sender.track).toBe(rawTrack);
        expect(loadingTrack.stop).toHaveBeenCalled();
        workerSession.resolve(createSessionResult(createFakeTrack('processed')));
        await expect(init).rejects.toThrow();
    });

    it('restores the camera track even when released before the loading track reached the sender', async () => {
        const sender = createFakeSender(createFakeTrack('camera'));
        const { processor, rawTrack } = startInit(sender);

        await processor.destroy();
        await flush();

        expect(sender.track).toBe(rawTrack);
        expect(loadingTrack.stop).toHaveBeenCalled();
    });

    it('does not create a loading track without a sender', async () => {
        const captureStream = vi.spyOn(HTMLCanvasElement.prototype, 'captureStream');
        const { init } = startInit(undefined);
        workerSession.resolve(createSessionResult(createFakeTrack('processed')));
        await init;

        expect(captureStream).not.toHaveBeenCalled();
    });

    it('keeps the newer loading track when a superseded initialization fails', async () => {
        const sender = createFakeSender(createFakeTrack('camera'));
        const firstSession = createDeferred<WorkerSessionResult>();
        vi.mocked(WorkerSession.create).mockReturnValueOnce(firstSession.promise);
        const { processor, init: firstInit, options } = startInit(sender);
        await flush();

        await processor.destroy();
        await flush();
        void processor.init(options);
        await flush();
        const [, newerLoadingTrack] = loadingTracks;
        expect(sender.track).toBe(newerLoadingTrack);

        firstSession.resolve(createSessionResult(createFakeTrack('processed')));
        await expect(firstInit).rejects.toThrow();
        await flush();

        expect(sender.track).toBe(newerLoadingTrack);
        expect(newerLoadingTrack.stop).not.toHaveBeenCalled();
    });
});

describe('BackgroundEffectProcessor warmups', () => {
    beforeEach(() => {
        vi.mocked(WorkerSession.create).mockReturnValue(new Promise(() => {}));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const options = {
        kind: 'video',
        track: createFakeTrack('camera'),
    } as unknown as ProcessorOptions<Track.Kind.Video>;

    it('reports every warmup, including a restart on a new camera track', async () => {
        const processor = createBackgroundProcessorHandle({ mode: { type: 'image', imageUrl: 'office.jpg' } });
        const onWarmup = vi.fn();
        processor.onWarmup(onWarmup);

        void processor.init(options);
        void processor.restart?.(options);
        await flush();

        expect(onWarmup).toHaveBeenCalledTimes(2);
        expect(onWarmup).toHaveBeenLastCalledWith({ type: 'image', imageUrl: 'office.jpg' });
    });
});

describe('BackgroundEffectProcessor segmentation model', () => {
    const DEVICE_MODEL_PATH = '/assets/background-blur/selfie_multiclass_256x256.tflite';
    const SIMPLE_MODEL_PATH = '/assets/background-blur/selfie_segmenter.tflite';

    const createFakeSegmenter = (modelPath: string) =>
        ({ delegate: 'GPU', modelPath, connect: vi.fn(), terminate: vi.fn() }) as unknown as SegmenterHandle & {
            terminate: ReturnType<typeof vi.fn>;
        };

    const createFakeSession = (initialSegmenter: SegmenterHandle) => {
        let segmenter: SegmenterHandle | null = initialSegmenter;
        return {
            processedTrack: createFakeTrack('processed'),
            get segmenter() {
                return segmenter;
            },
            replaceSegmenter: vi.fn((next: SegmenterHandle | null) => {
                segmenter?.terminate();
                segmenter = next;
            }),
            setDebugView: vi.fn(),
            destroy: vi.fn(),
        };
    };

    const options = {
        kind: 'video',
        track: createFakeTrack('camera'),
    } as unknown as ProcessorOptions<Track.Kind.Video>;

    const createProcessor = (deviceModelPath = DEVICE_MODEL_PATH) =>
        createBackgroundProcessorHandle({
            assetPaths: { modelAssetPath: deviceModelPath },
            simpleSegmentationAssetPaths: { modelAssetPath: SIMPLE_MODEL_PATH },
        });

    beforeEach(() => {
        vi.mocked(startSegmenter).mockImplementation(async ({ assetPaths }) =>
            createFakeSegmenter(assetPaths!.modelAssetPath!)
        );
        vi.mocked(WorkerSession.create).mockImplementation(
            async ({ startSegmenter: start }) =>
                ({ session: createFakeSession(await start()), unusedSegmenter: null }) as unknown as WorkerSessionResult
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('reports no model without a session', () => {
        expect(createProcessor().getSegmentationModel()).toBeNull();
    });

    it('swaps the running segmenter for the simple model and back', async () => {
        const processor = createProcessor();
        await processor.init(options);
        expect(processor.getSegmentationModel()).toBe('selfie_multiclass_256x256.tflite');

        await processor.setSimpleSegmentation(true);
        expect(processor.getSegmentationModel()).toBe('selfie_segmenter.tflite');

        await processor.setSimpleSegmentation(false);
        expect(processor.getSegmentationModel()).toBe('selfie_multiclass_256x256.tflite');
    });

    it('does not restart the segmenter when the device already runs the simple model', async () => {
        const processor = createProcessor(SIMPLE_MODEL_PATH);
        await processor.init(options);
        vi.mocked(startSegmenter).mockClear();

        await processor.setSimpleSegmentation(true);

        expect(startSegmenter).not.toHaveBeenCalled();
        expect(processor.getSegmentationModel()).toBe('selfie_segmenter.tflite');
    });

    it('drops a swap superseded by a newer call', async () => {
        const processor = createProcessor();
        await processor.init(options);

        const pendingSegmenter = createDeferred<SegmenterHandle>();
        vi.mocked(startSegmenter).mockReturnValueOnce(pendingSegmenter.promise);
        const supersededSwap = processor.setSimpleSegmentation(true);
        await processor.setSimpleSegmentation(false);

        const lateSegmenter = createFakeSegmenter(SIMPLE_MODEL_PATH);
        pendingSegmenter.resolve(lateSegmenter);
        await supersededSwap;

        expect(lateSegmenter.terminate).toHaveBeenCalled();
        expect(processor.getSegmentationModel()).toBe('selfie_multiclass_256x256.tflite');
    });

    it('drops a swap that finishes after the processor was destroyed', async () => {
        const processor = createProcessor();
        await processor.init(options);

        const pendingSegmenter = createDeferred<SegmenterHandle>();
        vi.mocked(startSegmenter).mockReturnValueOnce(pendingSegmenter.promise);
        const swap = processor.setSimpleSegmentation(true);
        await processor.destroy();

        const lateSegmenter = createFakeSegmenter(SIMPLE_MODEL_PATH);
        pendingSegmenter.resolve(lateSegmenter);
        await swap;

        expect(lateSegmenter.terminate).toHaveBeenCalled();
        expect(processor.getSegmentationModel()).toBeNull();
    });

    it('keeps the effect initializing when a swap before the first mask fails to start its segmenter', async () => {
        const processor = createProcessor();
        await processor.init(options);
        const [{ onApplied }] = vi.mocked(WorkerSession.create).mock.calls[0];
        const applied = processor.waitUntilApplied();

        vi.mocked(startSegmenter).mockRejectedValueOnce(new Error('The simple model failed to load'));
        await expect(processor.setSimpleSegmentation(true)).rejects.toThrow('The simple model failed to load');

        expect(processor.getSegmentationModel()).toBe('selfie_multiclass_256x256.tflite');
        onApplied();
        await expect(applied).resolves.toBeUndefined();
        await expect(processor.waitUntilApplied()).resolves.toBeUndefined();
    });

    it('starts the next session on the simple model when switched without a session', async () => {
        const processor = createProcessor();

        await processor.setSimpleSegmentation(true);
        expect(startSegmenter).not.toHaveBeenCalled();

        await processor.init(options);
        expect(processor.getSegmentationModel()).toBe('selfie_segmenter.tflite');
    });
});
