/// <reference lib="webworker" />
import * as vision from '@mediapipe/tasks-vision';

import {
    MASK_TEMPORAL_APPEAR_RATE,
    MASK_TEMPORAL_APPEAR_RATE_FAST,
    MASK_TEMPORAL_DISAPPEAR_RATE,
    MASK_TEMPORAL_DISAPPEAR_RATE_FAST,
    MASK_TEMPORAL_MOTION_HIGH,
    MASK_TEMPORAL_MOTION_LOW,
    MULTICLASS_PERSON_CONFIDENCE_BOOST,
    PERSON_CONFIDENCE_BOOST,
} from './constants';
import type { TunableConstantsOverrides } from './tunableConstants';

declare const self: DedicatedWorkerGlobalScope;

// MediaPipe's GPU mask readback runs isIOS() (platform_utils.ts), which does
// `'ontouchend' in document`. In a Worker `document` is undefined, so on macOS
// this throws and every mask fails -> no blur. The stub makes those checks
// answer harmlessly: has() => false (the `in` check), and createElement returns
// an OffscreenCanvas for MediaPipe's other worker path.
// See: https://github.com/google/mediapipe/issues/4694
if (typeof (self as { document?: unknown }).document === 'undefined') {
    (self as { document?: unknown }).document = new Proxy(
        {},
        {
            get(_target, prop) {
                if (prop === 'createElement') {
                    return (tag: string) => (tag === 'canvas' ? new OffscreenCanvas(1, 1) : {});
                }
                // MediaPipe's WASM also calls document.addEventListener/removeEventListener;
                // no-ops avoid "is not a function" since there's nothing to listen to in a Worker.
                if (prop === 'addEventListener' || prop === 'removeEventListener') {
                    return () => {};
                }
                return undefined;
            },
            has() {
                return false;
            },
        }
    );
}

// MediaPipe only allocates the R32F mask attachment its readPixels(RED, FLOAT)
// readback expects when all three of these are present; otherwise it downgrades
// to R16F and every mask reads back as zeros. Mobile GPUs frequently miss them.
// The CPU delegate returns the mask as a Float32Array, with no readback at all.
const GPU_MASK_READBACK_EXTENSIONS = ['EXT_color_buffer_float', 'OES_texture_float_linear', 'EXT_float_blend'];

const supportsGpuMaskReadback = (): boolean => {
    try {
        const gl = new OffscreenCanvas(1, 1).getContext('webgl2');
        if (!gl) {
            return false;
        }
        const isSupported = GPU_MASK_READBACK_EXTENSIONS.every((extension) => !!gl.getExtension(extension));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return isSupported;
    } catch {
        return false;
    }
};

const resolveDelegate = (requestedDelegate: 'GPU' | 'CPU'): 'GPU' | 'CPU' =>
    requestedDelegate === 'GPU' && !supportsGpuMaskReadback() ? 'CPU' : requestedDelegate;

type InitMessage = {
    type: 'init';
    wasmLoaderUrl: string;
    wasmBinaryUrl: string;
    modelBuffer: ArrayBuffer;
    delegate: 'GPU' | 'CPU';
    constantOverrides?: TunableConstantsOverrides;
};

type SegmentMessage = {
    type: 'segment';
    bitmap: ImageBitmap;
    timestamp: number;
    // Correlation id so the main thread can match this reply to the frame it
    // requested (and ignore stale/warmup replies).
    id: number;
};

type DestroyMessage = { type: 'destroy' };

type InboundMessage = InitMessage | SegmentMessage | DestroyMessage;

let segmenter: vision.ImageSegmenter | null = null;
// OffscreenCanvas is required for GPU delegate inside a Worker — MediaPipe
// initializes its own WebGL2 context on this canvas. A small canvas is fine;
// MediaPipe resizes internally.
let offscreenCanvas: OffscreenCanvas | null = null;
let activeDelegate: 'GPU' | 'CPU' | undefined;

const workerConstants = {
    personConfidenceBoost: PERSON_CONFIDENCE_BOOST,
    multiclassPersonConfidenceBoost: MULTICLASS_PERSON_CONFIDENCE_BOOST,
    maskTemporalAppearRate: MASK_TEMPORAL_APPEAR_RATE,
    maskTemporalDisappearRate: MASK_TEMPORAL_DISAPPEAR_RATE,
    maskTemporalAppearRateFast: MASK_TEMPORAL_APPEAR_RATE_FAST,
    maskTemporalDisappearRateFast: MASK_TEMPORAL_DISAPPEAR_RATE_FAST,
    maskTemporalMotionLow: MASK_TEMPORAL_MOTION_LOW,
    maskTemporalMotionHigh: MASK_TEMPORAL_MOTION_HIGH,
};

// Merge only the numeric fields the worker owns; unknown / main-thread-only
// keys in the payload are ignored.
const applyConstantOverrides = (overrides: TunableConstantsOverrides | undefined) => {
    if (!overrides) {
        return;
    }
    for (const key of Object.keys(workerConstants) as (keyof typeof workerConstants)[]) {
        const value = overrides[key];
        if (typeof value === 'number' && Number.isFinite(value)) {
            workerConstants[key] = value;
        }
    }
};
// Last timestamp (integer ms) fed to segmentForVideo. MediaPipe's VIDEO graph
// requires strictly increasing timestamps; see handleSegment for the full
// rationale. Reset whenever a fresh segmenter (graph) is created.
let lastSegmentTimestampMs = -1;

// Previous frame's smoothed mask, kept for the EMA. Separate from the posted
// buffer, which is transferred away each reply. Reset on dimension change or a
// fresh segmenter graph.
let previousMask: Float32Array | null = null;

const resetTemporalState = () => {
    previousMask = null;
};

// GLSL-style smoothstep.
const smoothstep = (edge0: number, edge1: number, x: number): number => {
    if (edge0 === edge1) {
        return x < edge0 ? 0 : 1;
    }
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
};

// Per-pixel EMA with motion-aware asymmetric hysteresis (see constants.ts).
// Mutates `current` in place and mirrors it into `previousMask`.
const applyTemporalSmoothing = (current: Float32Array): Float32Array => {
    const prev = previousMask;
    // First frame after a reset: adopt current as-is and seed the history.
    if (!prev || prev.length !== current.length) {
        previousMask = new Float32Array(current);
        return current;
    }

    for (let i = 0; i < current.length; i++) {
        const previousValue = prev[i];
        const delta = current[i] - previousValue;
        const motion = smoothstep(
            workerConstants.maskTemporalMotionLow,
            workerConstants.maskTemporalMotionHigh,
            Math.abs(delta)
        );
        const rate =
            delta >= 0
                ? workerConstants.maskTemporalAppearRate +
                  (workerConstants.maskTemporalAppearRateFast - workerConstants.maskTemporalAppearRate) * motion
                : workerConstants.maskTemporalDisappearRate +
                  (workerConstants.maskTemporalDisappearRateFast - workerConstants.maskTemporalDisappearRate) * motion;
        const smoothed = previousValue + rate * delta;
        current[i] = smoothed;
        prev[i] = smoothed;
    }

    return current;
};

const initSegmenter = async (msg: InitMessage, attemptDelegate: 'GPU' | 'CPU') => {
    offscreenCanvas = new OffscreenCanvas(256, 256);

    const fileSet = {
        wasmLoaderPath: msg.wasmLoaderUrl,
        wasmBinaryPath: msg.wasmBinaryUrl,
    };

    // initSegmenter can run twice (GPU attempt, then CPU fallback). The ArrayBuffer
    // is retained, so each attempt wraps a fresh Uint8Array view over it.
    const modelAssetBuffer = new Uint8Array(msg.modelBuffer);

    segmenter = await vision.ImageSegmenter.createFromOptions(fileSet, {
        baseOptions: {
            modelAssetBuffer,
            delegate: attemptDelegate,
        },
        canvas: offscreenCanvas as unknown as HTMLCanvasElement,
        runningMode: 'VIDEO',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
    });
    activeDelegate = attemptDelegate;
    // Fresh graph: reset the timestamp baseline and drop the retained mask.
    lastSegmentTimestampMs = -1;
    resetTemporalState();
};

const handleInit = async (msg: InitMessage) => {
    applyConstantOverrides(msg.constantOverrides);
    const delegate = resolveDelegate(msg.delegate);
    try {
        await initSegmenter(msg, delegate);
        self.postMessage({ type: 'ready', delegate: activeDelegate });
    } catch (error) {
        // Fall back to CPU delegate if GPU init fails inside the worker
        if (delegate === 'GPU') {
            try {
                await initSegmenter(msg, 'CPU');
                self.postMessage({ type: 'ready', delegate: activeDelegate });
                return;
            } catch (cpuError) {
                self.postMessage({ type: 'error', message: (cpuError as Error).message });
                return;
            }
        }
        self.postMessage({ type: 'error', message: (error as Error).message });
    }
};

// Multiclass model classes: 0=background, 1=hair, 2=body-skin, 3=face-skin,
// 4=clothes, 5=others. The masks are a per-pixel softmax, so person =
// 1 - background (= the sum of all person classes). The simple model only has
// 0=background and 1=person (some variants emit a single person mask), so the
// person mask is read directly.
type PersonConfidence = {
    mask: Float32Array;
    // The masks never made it back from the GPU, so every class read as 0.0.
    isSourceEmpty: boolean;
};

const hasEmptyBackgroundClass = (masks: vision.MPMask[]): boolean => {
    if (masks.length < 2) {
        return false;
    }

    const background = masks[0].getAsFloat32Array();

    return background.length > 0 && background.every((confidence) => confidence === 0);
};

const extractPersonConfidence = (masks: vision.MPMask[]): PersonConfidence => {
    const isSimpleModel = masks.length <= 2;
    // Simple model: read the person mask directly. Multiclass: read background
    // and invert it (person = 1 - background).
    const invert = !isSimpleModel;
    let sourceIndex = 0;
    if (isSimpleModel && masks.length !== 1) {
        sourceIndex = 1;
    }
    const source = masks[sourceIndex].getAsFloat32Array();

    // Always write into our own buffer. getAsFloat32Array() can hand back a view over
    // MediaPipe's WASM heap (the simple model's CPU readback does), and that buffer is
    // not detachable, so transferring it to the main thread throws and every mask fails.
    const out = new Float32Array(source.length);

    const boost = invert ? workerConstants.multiclassPersonConfidenceBoost : workerConstants.personConfidenceBoost;
    let isSourceAllZero = source.length > 0;
    for (let pixel = 0; pixel < source.length; pixel++) {
        const confidence = source[pixel];
        if (confidence !== 0) {
            isSourceAllZero = false;
        }
        const person = invert ? 1 - confidence : confidence;
        out[pixel] = Math.min(1, person * boost);
    }

    // Multiclass already reads the background class. The simple model doesn't, so its
    // all-zero result is ambiguous and needs a second (costlier) readback to settle.
    const isSourceEmpty = isSourceAllZero && (invert || hasEmptyBackgroundClass(masks));

    return { mask: out, isSourceEmpty };
};

// MediaPipe's VIDEO running mode feeds packets into a graph that requires
// strictly monotonically increasing timestamps (rounded to whole microseconds).
// The main thread tags each request with performance.now(), but clock-resolution
// clamping and rounding can yield equal or backwards microsecond values for
// frames that arrive close together. A single violation puts the graph into a
// permanent error state ("Packet timestamp mismatch ... free_memory"), after
// which every subsequent segmentForVideo call fails and the mask freezes. Clamp
// to a strictly increasing integer-millisecond timestamp here, at the actual
// segmentForVideo call site, so the graph can never be wedged by a bad value.
const handleSegment = (msg: SegmentMessage) => {
    const { id } = msg;
    if (!segmenter) {
        msg.bitmap.close();
        self.postMessage({ type: 'mask-failed', id });
        return;
    }

    const timestampMs = Math.max(Math.round(msg.timestamp), lastSegmentTimestampMs + 1);
    lastSegmentTimestampMs = timestampMs;

    try {
        segmenter.segmentForVideo(msg.bitmap, timestampMs, (result) => {
            try {
                const masks = result.confidenceMasks ?? [];
                if (masks.length === 0) {
                    self.postMessage({ type: 'mask-failed', id });
                    return;
                }

                const width = masks[0].width;
                const height = masks[0].height;
                const { mask, isSourceEmpty } = extractPersonConfidence(masks);

                if (isSourceEmpty) {
                    self.postMessage({ type: 'mask-failed', id });
                    return;
                }

                // EMA here; the morphological close runs on the GPU main thread.
                const combined = applyTemporalSmoothing(mask);

                self.postMessage(
                    {
                        type: 'mask',
                        id,
                        width,
                        height,
                        buffer: combined.buffer,
                    },
                    [combined.buffer]
                );
            } finally {
                result.close();
                msg.bitmap.close();
            }
        });
    } catch {
        msg.bitmap.close();
        self.postMessage({ type: 'mask-failed', id });
    }
};

self.onmessage = (event: MessageEvent<InboundMessage>) => {
    const msg = event.data;
    if (msg.type === 'init') {
        void handleInit(msg);
    } else if (msg.type === 'segment') {
        handleSegment(msg);
    } else if (msg.type === 'destroy') {
        segmenter?.close();
        segmenter = null;
        offscreenCanvas = null;
        resetTemporalState();
        self.close();
    }
};
