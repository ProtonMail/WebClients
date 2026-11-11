import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BackgroundPipeline, type PipelineConfig } from './BackgroundPipeline';
import type { SegmentationClient, SegmentationResult } from './segmentationClient';

vi.mock('./compositor', () => ({
    createCompositor: () => ({
        gl: {},
        renderFrame: () => {},
        updateMask: () => {},
        setBackgroundImage: async () => {},
        setBlurRadius: () => {},
        setDebugView: () => {},
        cleanup: () => {},
    }),
}));

vi.mock('./maskShaper', () => ({
    MaskShaper: class {
        outputTexture = {};

        upload() {
            return true;
        }

        dispose() {}
    },
}));

const WIDTH = 640;
const HEIGHT = 480;
const LOADING_TIMEOUT_MS = 20000;

class FakeContext {
    arcs = 0;

    drawnSource: unknown = null;

    drawImage(source: { source?: unknown }) {
        this.drawnSource = source.source;
    }

    getImageData(_x: number, _y: number, width: number, height: number) {
        const channel = this.drawnSource === 'blank' ? 0 : 120;
        return { data: new Uint8ClampedArray(width * height * 4).fill(channel) };
    }

    fillRect() {}

    beginPath() {}

    arc() {
        this.arcs += 1;
    }

    stroke() {}
}

class FakeOffscreenCanvas {
    readonly context = new FakeContext();

    constructor(
        public width: number,
        public height: number
    ) {}

    getContext() {
        return this.context;
    }
}

class FakeVideoFrame {
    readonly timestamp: number;

    readonly codedWidth = WIDTH;

    readonly codedHeight = HEIGHT;

    readonly displayWidth = WIDTH;

    readonly displayHeight = HEIGHT;

    closed = false;

    constructor(
        readonly source: unknown,
        init?: { timestamp?: number }
    ) {
        this.timestamp = init?.timestamp ?? 0;
    }

    close() {
        this.closed = true;
    }
}

const createDeferred = <T>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => {
        resolve = done;
    });
    return { promise, resolve };
};

const MASK: SegmentationResult = { mask: new Uint8Array(4), width: 2, height: 2 };

const setup = () => {
    const outputCanvas = new FakeOffscreenCanvas(0, 0);
    const segmentation = {
        request: vi.fn<(bitmap: ImageBitmap) => Promise<SegmentationResult | null>>(async () => null),
        warmUp: vi.fn(),
        dispose: vi.fn(),
    };
    const hooks = { onApplied: vi.fn(), onInitializationFailed: vi.fn() };
    const config: PipelineConfig = {
        maskClosingRadius: 0,
        shaderMaxRadius: 0,
        segmentationInputMaxEdge: 1000,
        segmentationResizeQuality: 'low',
        segmentationFrameInterval: 1,
        minOutputFrameIntervalMs: 0,
        pauseSegmentationWhenHidden: false,
        notifyAppliedBeforeEnqueue: false,
        loadingColor: '#9494ff',
        loadingTimeoutMs: LOADING_TIMEOUT_MS,
    };
    const pipeline = new BackgroundPipeline(
        outputCanvas as unknown as OffscreenCanvas,
        segmentation as unknown as SegmentationClient,
        config,
        hooks,
        { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } as never
    );
    pipeline.init();

    const outputs: FakeVideoFrame[] = [];
    const controller = {
        enqueue: vi.fn((frame: FakeVideoFrame) => {
            outputs.push(frame);
        }),
    };
    const inputs: FakeVideoFrame[] = [];
    let nextTimestampUs = 1_000_000;
    const sendFrame = async (source: 'camera' | 'blank' = 'camera') => {
        const frame = new FakeVideoFrame(source, { timestamp: nextTimestampUs });
        nextTimestampUs += 33_000;
        inputs.push(frame);
        await pipeline.transform(
            frame as unknown as VideoFrame,
            controller as unknown as TransformStreamDefaultController<VideoFrame>
        );
    };

    const kindOf = (frame: FakeVideoFrame) => {
        if (inputs.includes(frame)) {
            return 'raw';
        }
        if (frame.source === outputCanvas) {
            return 'composited';
        }
        return (frame.source as FakeOffscreenCanvas).context.arcs > 0 ? 'loading' : 'black';
    };
    const outputKinds = () => outputs.map(kindOf);

    return { pipeline, segmentation, hooks, controller, outputs, outputKinds, sendFrame };
};

describe('BackgroundPipeline warmup', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('VideoFrame', FakeVideoFrame);
        vi.stubGlobal('OffscreenCanvas', FakeOffscreenCanvas);
        vi.stubGlobal(
            'createImageBitmap',
            vi.fn(async () => ({ close: () => {} }))
        );
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('publishes a loading frame instead of the camera frame for the first frame', async () => {
        const { outputKinds, sendFrame } = setup();

        await sendFrame();

        expect(outputKinds()).toEqual(['loading']);
    });

    it('keeps publishing loading frames while no camera frame arrives', async () => {
        const { outputKinds, sendFrame } = setup();
        await sendFrame();

        await vi.advanceTimersByTimeAsync(1000);

        expect(outputKinds().length).toBeGreaterThanOrEqual(10);
        expect(new Set(outputKinds())).toEqual(new Set(['loading']));
    });

    it('never publishes camera or black frames while masks are pending', async () => {
        const { pipeline, outputKinds, sendFrame } = setup();

        for (let index = 0; index < 20; index += 1) {
            await sendFrame();
            await pipeline.drain();
            await vi.advanceTimersByTimeAsync(33);
        }

        expect(new Set(outputKinds())).toEqual(new Set(['loading']));
    });

    it('switches from the last loading frame straight to the composited frame, then stops the loop', async () => {
        const { pipeline, segmentation, hooks, outputKinds, sendFrame } = setup();
        await sendFrame();
        await vi.advanceTimersByTimeAsync(500);
        const mask = createDeferred<SegmentationResult | null>();
        segmentation.request.mockReturnValueOnce(mask.promise);
        await sendFrame();
        await vi.advanceTimersByTimeAsync(500);

        mask.resolve(MASK);
        await pipeline.drain();
        const kindsAtSwitch = outputKinds();
        await vi.advanceTimersByTimeAsync(1000);

        expect(kindsAtSwitch.at(-2)).toBe('loading');
        expect(kindsAtSwitch.at(-1)).toBe('composited');
        expect(outputKinds()).toEqual(kindsAtSwitch);
        expect(hooks.onApplied).toHaveBeenCalledTimes(1);
    });

    it('keeps output timestamps strictly increasing across loading and composited frames', async () => {
        const { pipeline, segmentation, outputs, sendFrame } = setup();
        await sendFrame();
        const mask = createDeferred<SegmentationResult | null>();
        segmentation.request.mockReturnValueOnce(mask.promise);
        await sendFrame();
        await vi.advanceTimersByTimeAsync(1000);
        mask.resolve(MASK);
        await pipeline.drain();
        segmentation.request.mockResolvedValue(MASK);
        await sendFrame();
        await pipeline.drain();

        const timestamps = outputs.map((frame) => frame.timestamp);
        timestamps.slice(1).forEach((timestamp, index) => {
            expect(timestamp).toBeGreaterThan(timestamps[index]);
        });
    });

    it('stops the loading frames and falls back to black frames when the warmup times out', async () => {
        const { pipeline, outputKinds, sendFrame } = setup();
        await sendFrame();

        await vi.advanceTimersByTimeAsync(LOADING_TIMEOUT_MS);
        const countAtTimeout = outputKinds().length;
        await vi.advanceTimersByTimeAsync(1000);
        await sendFrame();
        await pipeline.drain();

        expect(outputKinds().slice(countAtTimeout)).toEqual(['black']);
    });

    it('stops the loading frames and falls back to black frames when segmentation keeps failing', async () => {
        const { pipeline, hooks, outputKinds, sendFrame } = setup();

        while (hooks.onInitializationFailed.mock.calls.length === 0) {
            await sendFrame();
            await pipeline.drain();
        }
        const countAtFailure = outputKinds().length;
        await vi.advanceTimersByTimeAsync(1000);
        await sendFrame();
        await pipeline.drain();

        expect(new Set(outputKinds().slice(countAtFailure))).toEqual(new Set(['black']));
    });

    it('publishes no loading frames while the effect is disabled', async () => {
        const { pipeline, outputKinds, sendFrame } = setup();
        await sendFrame();
        pipeline.setEnabled(false);
        const countAtDisable = outputKinds().length;

        await vi.advanceTimersByTimeAsync(1000);

        expect(outputKinds().length).toBe(countAtDisable);
    });

    it('stops the loading frames when destroyed', async () => {
        const { pipeline, outputKinds, sendFrame } = setup();
        await sendFrame();
        pipeline.destroy();
        const countAtDestroy = outputKinds().length;

        await vi.advanceTimersByTimeAsync(1000);

        expect(outputKinds().length).toBe(countAtDestroy);
    });

    it('stops the loading frames once the output stream rejects them', async () => {
        const { controller, sendFrame } = setup();
        await sendFrame();
        controller.enqueue.mockImplementation(() => {
            throw new TypeError('The stream is closed');
        });
        const callsAtClose = controller.enqueue.mock.calls.length;

        await vi.advanceTimersByTimeAsync(1000);

        expect(controller.enqueue).toHaveBeenCalledTimes(callsAtClose + 1);
    });

    it('keeps the loading frames while the first mask arrives with a blank camera frame', async () => {
        const { pipeline, segmentation, hooks, outputKinds, sendFrame } = setup();
        await sendFrame();
        segmentation.request.mockResolvedValue(MASK);

        await sendFrame('blank');
        await pipeline.drain();
        await vi.advanceTimersByTimeAsync(1000);

        expect(new Set(outputKinds())).toEqual(new Set(['loading']));
        expect(hooks.onApplied).not.toHaveBeenCalled();
    });

    it('ends the loading frames with the first non-blank camera frame after blank ones', async () => {
        const { pipeline, segmentation, hooks, outputKinds, sendFrame } = setup();
        await sendFrame();
        segmentation.request.mockResolvedValue(MASK);
        await sendFrame('blank');
        await pipeline.drain();

        await sendFrame();
        await pipeline.drain();
        const kindsAtSwitch = outputKinds();
        await vi.advanceTimersByTimeAsync(1000);

        expect(kindsAtSwitch.at(-2)).toBe('loading');
        expect(kindsAtSwitch.at(-1)).toBe('composited');
        expect(outputKinds()).toEqual(kindsAtSwitch);
        expect(hooks.onApplied).toHaveBeenCalledTimes(1);
    });

    it('ends the loading frames on a camera that keeps sending blank frames, long before the loading timeout', async () => {
        const { pipeline, segmentation, hooks, outputKinds, sendFrame } = setup();
        await sendFrame();
        segmentation.request.mockResolvedValue(MASK);

        for (let elapsedMs = 0; elapsedMs < 3000; elapsedMs += 33) {
            await sendFrame('blank');
            await pipeline.drain();
            await vi.advanceTimersByTimeAsync(33);
        }
        const kindsAfterBlankFrames = outputKinds();
        await vi.advanceTimersByTimeAsync(1000);

        expect(hooks.onApplied).toHaveBeenCalledTimes(1);
        expect(kindsAfterBlankFrames.at(-1)).toBe('composited');
        expect(outputKinds()).toEqual(kindsAfterBlankFrames);
    });

    it('composites blank camera frames once loading has ended', async () => {
        const { pipeline, segmentation, outputKinds, sendFrame } = setup();
        await sendFrame();
        segmentation.request.mockResolvedValue(MASK);
        await sendFrame();
        await pipeline.drain();
        const countAtSwitch = outputKinds().length;

        await sendFrame('blank');
        await pipeline.drain();

        expect(outputKinds().slice(countAtSwitch)).toEqual(['composited']);
    });
});
