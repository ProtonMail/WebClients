import {
    type BackgroundOptions,
    ProcessorWrapper,
    VideoTransformer,
    type VideoTransformerInitOptions,
} from '@livekit/track-processors';

import { withTimeout } from '@proton/meet/utils/withTimeout';
import { isFirefox, isIos } from '@proton/shared/lib/helpers/browser';

import {
    BACKGROUND_IMAGE_DECODE_TIMEOUT_MS,
    MAX_BACKGROUND_IMAGE_EDGE,
    MAX_BACKGROUND_IMAGE_PIXELS,
} from '../../utils/customBackgrounds/constants';
import {
    DEFAULT_ASSET_PATH,
    DEFAULT_MODEL_PATH,
    MASK_CLOSING_MAX_RADIUS,
    MASK_PASS_COPY,
    MASK_PASS_DILATE,
    MASK_PASS_ERODE,
    MASK_TEMPORAL_APPEAR_RATE,
    MASK_TEMPORAL_APPEAR_RATE_FAST,
    MASK_TEMPORAL_DISAPPEAR_RATE,
    MASK_TEMPORAL_DISAPPEAR_RATE_FAST,
    MASK_TEMPORAL_REFERENCE_FPS,
    MAX_FPS_MOBILE,
    MULTICLASS_PERSON_CONFIDENCE_BOOST,
    PERSON_CONFIDENCE_BOOST,
    SEGMENTATION_FRAME_INTERVAL,
    TEXTURE_UNIT_OUTPUT,
    VERTEX_SHADER_SOURCE,
    VERTICES,
    buildFragmentShaderSource,
} from './constants';
import { createProcessorWrapper } from './createProcessorWrapper';
import {
    DEFAULT_BLUR_RADIUS,
    type TunableConstantsOverrides,
    getDefaultMaskClosingRadius,
    getDefaultSegmentationInputMaxEdge,
    getSegmentationResizeQuality,
    pickWorkerOverrides,
} from './tunableConstants';
import type { BackgroundMode, BackgroundProcessor, BackgroundProcessorOptions } from './types';

const CACHE_NAME = 'proton-meet-background-blur-v1';

// Decoded backgrounds kept so returning to a recent image skips the decode. Each
// entry holds a full-resolution bitmap, hence the small bound.
const MAX_CACHED_BACKGROUND_BITMAPS = 4;

// Safety net for a wedged worker: if a single frame's mask doesn't come back in
// this long we give up on it (reusing the previous mask) instead of freezing the
// video. Healthy round-trips are tens of milliseconds, so this never trips in
// normal operation.
const SEGMENTATION_TIMEOUT_MS = 2000;

// Consecutive segmentation failures tolerated before the first mask before the
// background initialization is treated as failed.
const CONSECUTIVE_MASK_FAILURE_LIMIT = 500;

const INITIAL_MASK_TIMEOUT_MS = 20000;

type SegmentationResult = { mask: Float32Array; width: number; height: number };

type AppliedWaiter = { resolve: () => void; reject: (error: Error) => void };

// Restate an EMA rate over `periods` reference periods instead of one, holding the
// time constant fixed: applying r each period leaves (1 - r)^periods of the gap.
const resampleTemporalRate = (rate: number, periods: number): number => {
    if (periods <= 1 || rate <= 0 || rate >= 1) {
        return rate;
    }
    return 1 - (1 - rate) ** periods;
};

const fetchWithCache = async (url: string): Promise<Response> => {
    if (!('caches' in window)) {
        return fetch(url);
    }

    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(url);

        if (cachedResponse) {
            return cachedResponse;
        }

        const response = await fetch(url);
        if (response.ok) {
            await cache.put(url, response.clone());
        }
        return response;
    } catch {
        return fetch(url);
    }
};

const getCachedModelBuffer = async (modelPath: string): Promise<ArrayBuffer> => {
    const response = await fetchWithCache(modelPath);
    return response.arrayBuffer();
};

export const preloadBackgroundBlurAssets = async (assetPaths?: {
    tasksVisionFileSet?: string;
    modelAssetPath?: string;
}) => {
    if (!('caches' in window)) {
        return;
    }

    const filesetPath = assetPaths?.tasksVisionFileSet ?? DEFAULT_ASSET_PATH;
    const modelPath = assetPaths?.modelAssetPath ?? DEFAULT_MODEL_PATH;

    const wasmFiles = [`${filesetPath}/vision_wasm_internal.wasm`, `${filesetPath}/vision_wasm_internal.js`, modelPath];

    try {
        const cache = await caches.open(CACHE_NAME);

        await Promise.all(
            wasmFiles.map(async (url) => {
                try {
                    const cached = await cache.match(url);
                    if (!cached) {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response);
                        }
                    }
                } catch {
                    // Ignore individual fetch errors
                }
            })
        );
    } catch {
        // Cache API failed, but don't block
    }
};

const backgroundKey = (mode: BackgroundMode): string | null =>
    mode.type === 'image' ? `image:${mode.imageUrl}` : null;

/**
 * Runs the MediaPipe segmenter in a worker, shapes the person-confidence mask on
 * the GPU, and hands the inverted mask to LiveKit's WebGL compositor.
 *
 * Blur and image backgrounds are modes of this one pipeline, since the compositor
 * holds a blur radius and a background image as independent state and picks
 * between them per frame. {@link setMode} therefore swaps the look without
 * restarting the segmenter or the track.
 */
export class BackgroundProcessorTransformer extends VideoTransformer<BackgroundOptions> {
    static get isSupported() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');

        const isSupported =
            typeof OffscreenCanvas !== 'undefined' &&
            typeof VideoFrame !== 'undefined' &&
            typeof createImageBitmap !== 'undefined' &&
            !!gl;

        if (gl) {
            gl.getExtension('WEBGL_lose_context')?.loseContext();
        }

        return isSupported;
    }

    options: BackgroundProcessorOptions;

    isFirstFrame = true;

    private maskGl?: WebGL2RenderingContext | null;
    // Canvas maskGl and every mask resource below were created against.
    private maskGlCanvas: unknown = null;
    private maskShaderProgram?: WebGLProgram | null;
    private maskVertexBuffer?: WebGLBuffer | null;
    private maskFramebuffer?: WebGLFramebuffer | null;
    private maskOutputTexture?: WebGLTexture | null;
    // Ping-pong pair for the four morphological-close passes; only allocated
    // when the closing radius is > 0.
    private maskMorphTextureA?: WebGLTexture | null;
    private maskMorphTextureB?: WebGLTexture | null;
    // Morphological-close radius in mask texels, sized by device tier; 0 disables.
    private readonly maskClosingRadius: number;
    // Longest edge (px) the frame is downscaled to before segmentation.
    private readonly segmentationInputMaxEdge: number;
    // Composited frames per segmentation request; 1 segments every frame.
    private readonly segmentationFrameInterval: number;
    private framesSinceSegmentation = 0;
    // Minimum spacing (ms) between composited frames; 0 leaves the rate uncapped.
    private readonly minOutputFrameIntervalMs: number;
    private lastOutputFrameTimeMs = 0;
    private lastCanvasWidth = 0;
    private lastCanvasHeight = 0;
    activeDelegate: 'GPU' | 'CPU' | undefined;
    private maskInputTexture?: WebGLTexture | null;
    private maskInputPbo?: WebGLBuffer | null;
    // Dimensions of the currently allocated mask textures (input R32F and output
    // RGBA8). Both are sized to the incoming mask and resized together, so a
    // single pair gates every (re)allocation.
    private maskWidth = 0;
    private maskHeight = 0;

    // Cached GLSL locations. getUniformLocation/getAttribLocation are resolved
    // once after the program links instead of on every composited frame.
    private maskUniformLocations: {
        mask: WebGLUniformLocation | null;
        blurStep: WebGLUniformLocation | null;
        invert: WebGLUniformLocation | null;
        mode: WebGLUniformLocation | null;
        radius: WebGLUniformLocation | null;
    } | null = null;

    private maskAttribLocations: {
        position: number;
        texCoord: number;
    } | null = null;

    // Worker-based inference: the worker owns the MediaPipe ImageSegmenter so
    // inference runs off the main thread. transform() requests the mask for the
    // CURRENT frame and awaits it before compositing, so the silhouette always
    // matches the frame it is applied to (no temporal lag). Stream backpressure
    // drops intermediate camera frames while we wait, so we always process the
    // most recent frame instead of queueing stale ones.
    private worker: Worker | null = null;
    private workerReady = false;
    private segmentRequestId = 0;
    private pendingSegmentation: { id: number; resolve: (result: SegmentationResult | null) => void } | null = null;
    private hasInitialMask = false;

    private appliedWaiters: AppliedWaiter[] = [];

    private initializationError: Error | null = null;

    private consecutiveMaskFailures = 0;

    // True while a mask request is awaiting the worker. The stream-processor path
    // (Chrome) applies backpressure so transform() runs strictly serially and this
    // never blocks a request. The fallback requestAnimationFrame path (Firefox /
    // Safari, which lack MediaStreamTrackGenerator) calls transform() WITHOUT
    // awaiting it, so frames overlap; without this guard each overlapping frame
    // would clobber the single pendingSegmentation slot and flood the worker,
    // leaving the mask frozen while the video keeps moving. When a request is
    // already in flight we instead composite with the most recent mask.
    private maskRequestInFlight = false;

    // Opaque-black canvas that masks the feed until the first segmentation mask
    // is ready, so the unprocessed background is never visible during warmup.
    private blackFrameCanvas: OffscreenCanvas | null = null;

    // Only iOS hands us frames whose orientation and dimensions disagree with what
    // the video element presents. Keyed on the OS, not the engine: it affects every
    // browser on iOS, but not WebKit elsewhere.
    private readonly needsIosOrientationWorkaround = isIos();

    // Reused surface for redrawing rotated camera frames upright.
    private orientationCanvas: OffscreenCanvas | null = null;
    private orientationContext: OffscreenCanvasRenderingContext2D | null = null;
    private settingsSize: { width: number; height: number } | null = null;
    private isReorienting = false;

    // Segmentation-sized surface, only used while reorienting.
    private segmentationCanvas: OffscreenCanvas | null = null;
    private segmentationContext: OffscreenCanvasRenderingContext2D | null = null;

    // The fallback render loop overlaps transform() calls, which must not composite
    // against half-torn-down GL resources.
    private isRebuildingCompositor = false;

    private outputSizeListener: ((width: number, height: number) => void) | null = null;

    private mode: BackgroundMode;

    // Most recently used last.
    private backgroundBitmaps = new Map<string, ImageBitmap>();

    // Currently on the compositor, so the cache never evicts it.
    private appliedBackgroundKey: string | null = null;

    // Blur radius currently on the compositor, or null when an image is.
    private appliedBlurRadius: number | null = null;

    // The compositor the two fields above describe. init()/restart() build a new
    // one with its own blank state, so the bookkeeping cannot carry across them.
    private appliedCompositor: unknown = null;

    // Bumped per applyMode() call so a superseded swap can bail out.
    private modeGeneration = 0;

    // Swaps currently holding the compositor mid-change; transform() drops frames
    // while any are. Tokens make teardown safe: a swap finishing after destroy()
    // cannot decrement state belonging to a newer initialization.
    private backgroundSwapsInFlight = new Set<symbol>();

    constructor(opts: BackgroundProcessorOptions) {
        super();
        this.options = opts;
        this.mode = opts.mode ?? { type: 'blur' };

        const overrides = opts.constantOverrides;

        this.maskClosingRadius = BackgroundProcessorTransformer.resolveInt(
            overrides?.maskClosingRadius,
            getDefaultMaskClosingRadius(opts),
            0
        );
        this.segmentationInputMaxEdge = BackgroundProcessorTransformer.resolveInt(
            overrides?.segmentationInputMaxEdge,
            getDefaultSegmentationInputMaxEdge(opts),
            1
        );
        this.segmentationFrameInterval = BackgroundProcessorTransformer.resolveInt(
            overrides?.segmentationFrameInterval,
            SEGMENTATION_FRAME_INTERVAL,
            1
        );
        // Stream-processor path only: ProcessorWrapper's maxFps already paces the
        // fallback, and both throttles at once would undershoot the cap.
        this.minOutputFrameIntervalMs =
            opts.isMobile && ProcessorWrapper.hasModernApiSupport ? 1000 / MAX_FPS_MOBILE : 0;
    }

    protected static resolveInt(override: number | undefined, fallback: number, min: number): number {
        return typeof override === 'number' && Number.isFinite(override)
            ? Math.max(min, Math.round(override))
            : fallback;
    }

    private async loadBackgroundImage(imageUrl: string): Promise<ImageBitmap> {
        const image = new Image();
        image.crossOrigin = 'anonymous';

        try {
            await withTimeout(
                new Promise<void>((resolve, reject) => {
                    image.onload = () => resolve();
                    image.onerror = () => reject(new Error('Failed to load background image'));
                    image.src = imageUrl;
                }),
                'Loading the background image',
                BACKGROUND_IMAGE_DECODE_TIMEOUT_MS
            );
        } finally {
            image.onload = null;
            image.onerror = null;
        }

        const { naturalWidth: width, naturalHeight: height } = image;

        if (!width || !height) {
            throw new Error('The background image decoded to no pixels');
        }

        if (
            width > MAX_BACKGROUND_IMAGE_EDGE ||
            height > MAX_BACKGROUND_IMAGE_EDGE ||
            width * height > MAX_BACKGROUND_IMAGE_PIXELS
        ) {
            throw new Error(`The background image is too large to composite: ${width}x${height}`);
        }

        return createImageBitmap(image);
    }

    // Runs before the compositor is touched, so a slow decode never leaves the
    // output stranded between backgrounds.
    private async prepareBackgroundBitmap(mode: BackgroundMode): Promise<ImageBitmap | null> {
        if (mode.type !== 'image') {
            return null;
        }

        const key = backgroundKey(mode)!;

        const cached = this.backgroundBitmaps.get(key);
        if (cached) {
            // Re-insert to mark as most recently used.
            this.backgroundBitmaps.delete(key);
            this.backgroundBitmaps.set(key, cached);
            return cached;
        }

        const bitmap = await this.loadBackgroundImage(mode.imageUrl);

        this.backgroundBitmaps.set(key, bitmap);
        this.evictCachedBackgroundBitmaps();

        return bitmap;
    }

    // Oldest first, skipping the one on screen. The compositor keeps its own
    // cover-cropped copy, so closing the source it was built from is safe.
    private evictCachedBackgroundBitmaps() {
        for (const [key, bitmap] of this.backgroundBitmaps) {
            if (this.backgroundBitmaps.size <= MAX_CACHED_BACKGROUND_BITMAPS) {
                return;
            }
            if (key === this.appliedBackgroundKey) {
                continue;
            }
            bitmap.close();
            this.backgroundBitmaps.delete(key);
        }
    }

    private isModeApplied(mode: BackgroundMode): boolean {
        if (mode.type === 'blur') {
            return this.appliedBackgroundKey === null && this.appliedBlurRadius === this.getBlurRadius(mode);
        }
        return this.appliedBlurRadius === null && this.appliedBackgroundKey === backgroundKey(mode);
    }

    // The compositor prefers blur whenever a radius is set, so an image has to
    // clear the radius before uploading its bitmap.
    private async applyMode(mode: BackgroundMode) {
        if (!this.gl) {
            return;
        }

        if (this.appliedCompositor !== this.gl) {
            // A fresh compositor holds none of what the previous one did.
            this.appliedCompositor = this.gl;
            this.appliedBackgroundKey = null;
            this.appliedBlurRadius = null;
        } else if (this.isModeApplied(mode)) {
            return;
        }

        const generation = ++this.modeGeneration;
        const bitmap = await this.prepareBackgroundBitmap(mode);

        // A newer swap took over, or the pipeline was torn down while decoding.
        if (generation !== this.modeGeneration || !this.gl) {
            return;
        }

        if (mode.type === 'image' && !bitmap) {
            throw new Error('The background image could not be prepared');
        }

        const swap = Symbol();
        this.backgroundSwapsInFlight.add(swap);

        try {
            if (mode.type === 'blur') {
                // setBlurRadius() drops the background image, so the key has to go too.
                this.appliedBackgroundKey = null;
                this.appliedBlurRadius = this.getBlurRadius(mode);
                this.gl.setBlurRadius(this.appliedBlurRadius);
            } else {
                this.gl.setBlurRadius(null);
                this.appliedBlurRadius = null;
                this.appliedBackgroundKey = backgroundKey(mode);
                await this.gl.setBackgroundImage(bitmap);
            }
        } finally {
            this.backgroundSwapsInFlight.delete(swap);
        }
    }

    // The debug tuner's radius wins over the mode's, and 0 is valid there.
    private getBlurRadius(mode: { blurRadius?: number }): number {
        const override = this.options.constantOverrides?.blurRadius;
        if (typeof override === 'number' && Number.isFinite(override)) {
            return Math.max(0, Math.round(override));
        }
        return typeof mode.blurRadius === 'number' ? mode.blurRadius : DEFAULT_BLUR_RADIUS;
    }

    // The segmenter keeps running, so the new background lands on the next
    // composited frame with no warmup.
    async setMode(mode: BackgroundMode) {
        const previousMode = this.mode;
        this.mode = mode;
        try {
            await this.applyMode(mode);
        } catch (error) {
            // Keep the last working mode for future compositor rebuilds. A newer
            // setMode() call owns the field if it changed while this one awaited.
            if (this.mode === mode) {
                this.mode = previousMode;
            }
            throw error;
        }
    }

    hasAppliedMask() {
        return this.hasInitialMask;
    }

    // Compile-time morphology loop ceiling for the shader. Must be >= the active
    // closing radius; keeps the production default as a floor.
    private getShaderMaxRadius() {
        return Math.max(MASK_CLOSING_MAX_RADIUS, this.maskClosingRadius);
    }

    // Mobile's frame cap and pacing interval slow the mask update rate below the one
    // the EMA rates were tuned at, which would leave the silhouette trailing behind
    // fast movement. Rescale them to the rate the mask actually updates at.
    private getTemporalRateOverrides(): TunableConstantsOverrides {
        if (!this.options.isMobile) {
            return {};
        }

        const maskUpdateFps = MAX_FPS_MOBILE / this.segmentationFrameInterval;
        const periods = MASK_TEMPORAL_REFERENCE_FPS / maskUpdateFps;

        return {
            maskTemporalAppearRate: resampleTemporalRate(MASK_TEMPORAL_APPEAR_RATE, periods),
            maskTemporalDisappearRate: resampleTemporalRate(MASK_TEMPORAL_DISAPPEAR_RATE, periods),
            maskTemporalAppearRateFast: resampleTemporalRate(MASK_TEMPORAL_APPEAR_RATE_FAST, periods),
            maskTemporalDisappearRateFast: resampleTemporalRate(MASK_TEMPORAL_DISAPPEAR_RATE_FAST, periods),
        };
    }

    // Worker-bound overrides for the init message. Person-confidence boosts keep
    // their existing Unleash-sourced defaults (options.*), and any debug-tuner
    // override wins over them.
    private getWorkerConstantOverrides(): TunableConstantsOverrides {
        return {
            personConfidenceBoost: this.options.personConfidenceBoost ?? PERSON_CONFIDENCE_BOOST,
            multiclassPersonConfidenceBoost:
                this.options.multiclassPersonConfidenceBoost ?? MULTICLASS_PERSON_CONFIDENCE_BOOST,
            ...this.getTemporalRateOverrides(),
            ...pickWorkerOverrides(this.options.constantOverrides ?? {}),
        };
    }

    // Resolves once the first processed frame is produced (or immediately if it
    // already was), and rejects if initialization failed or timed out.
    waitUntilApplied(): Promise<void> {
        if (this.hasInitialMask) {
            return Promise.resolve();
        }
        if (this.initializationError) {
            return Promise.reject(this.initializationError);
        }

        let waiter!: AppliedWaiter;
        const applied = new Promise<void>((resolve, reject) => {
            waiter = { resolve, reject };
        });
        this.appliedWaiters.push(waiter);

        return withTimeout(applied, 'Background effect initialization', INITIAL_MASK_TIMEOUT_MS).catch((error) => {
            // Drop the abandoned waiter so the list doesn't grow with every timed-out attempt.
            this.appliedWaiters = this.appliedWaiters.filter((entry) => entry !== waiter);
            throw error;
        });
    }

    private resolveApplied() {
        if (this.appliedWaiters.length === 0) {
            return;
        }
        const waiters = this.appliedWaiters;
        this.appliedWaiters = [];
        waiters.forEach(({ resolve }) => resolve());
    }

    private rejectApplied(error: Error) {
        if (this.hasInitialMask) {
            return;
        }
        this.initializationError = error;
        const waiters = this.appliedWaiters;
        this.appliedWaiters = [];
        waiters.forEach(({ reject }) => reject(error));
    }

    enable() {
        this.isDisabled = false;
    }

    disable() {
        this.isDisabled = true;
    }

    isEnabled() {
        return !this.isDisabled;
    }

    async init({ outputCanvas, inputElement: inputVideo }: VideoTransformerInitOptions) {
        // One processor instance can be initialized against several camera tracks,
        // and each one needs a fresh mask before it can be reported as applied.
        this.hasInitialMask = false;
        this.isFirstFrame = true;

        await super.init({ outputCanvas, inputElement: inputVideo });

        // Snapshot the track's own resolution before the first frame resizes the
        // canvas; the video element usually has no metadata to compare against yet.
        if (this.needsIosOrientationWorkaround && outputCanvas?.width && outputCanvas?.height) {
            this.settingsSize = { width: outputCanvas.width, height: outputCanvas.height };
        }

        await this.initializeWorker();
        await this.applyMode(this.mode);
    }

    setOutputSizeListener(listener: ((width: number, height: number) => void) | null) {
        this.outputSizeListener = listener;
    }

    // LiveKit's compositor allocates its framebuffers from the canvas once and never
    // resizes them, yet composites each frame at that frame's size. When the two
    // disagree the mask only covers part of the picture, and restarting is the only
    // way to reallocate.
    private async resizeOutputCanvas(width: number, height: number) {
        const canvas = this.canvas;
        if (!canvas) {
            return;
        }

        const needsCompositorRebuild =
            this.needsIosOrientationWorkaround && !!this.gl && (canvas.width !== width || canvas.height !== height);

        canvas.width = width;
        canvas.height = height;
        this.lastCanvasWidth = width;
        this.lastCanvasHeight = height;

        if (!this.needsIosOrientationWorkaround) {
            return;
        }

        this.outputSizeListener?.(width, height);

        if (!needsCompositorRebuild || !this.inputVideo) {
            return;
        }

        this.isRebuildingCompositor = true;
        // restart() re-enables the transformer.
        const wasDisabled = this.isDisabled;
        try {
            await super.restart({ outputCanvas: canvas, inputElement: this.inputVideo });
            await this.applyMode(this.mode);
            this.reapplyLastMask();
        } finally {
            this.isDisabled = wasDisabled;
            this.isRebuildingCompositor = false;
        }
    }

    // Empty mask textures composite as "no person anywhere", showing the unprocessed
    // camera frame until the next mask lands. Twice, to refill both sides of the
    // compositor's double buffer.
    private reapplyLastMask() {
        if (!this.gl || !this.maskOutputTexture || !this.hasInitialMask) {
            return;
        }
        this.gl.updateMask(this.maskOutputTexture);
        this.gl.updateMask(this.maskOutputTexture);
    }

    private async initializeWorker() {
        // init() may run more than once per instance (e.g. camera switch); tear
        // down any existing worker so we don't orphan it.
        this.teardownWorker();

        // Clear any prior failure so a retry starts clean.
        this.initializationError = null;
        this.consecutiveMaskFailures = 0;

        const filesetPath = this.options.assetPaths?.tasksVisionFileSet ?? DEFAULT_ASSET_PATH;
        const modelPath = this.options.assetPaths?.modelAssetPath ?? DEFAULT_MODEL_PATH;
        const wasmLoaderPath = `${filesetPath}/vision_wasm_internal.js`;
        const wasmBinaryPath = `${filesetPath}/vision_wasm_internal.wasm`;

        // Fetch through the existing cache layer on the main thread so we benefit
        // from the same cache.match() path the preloader populated.
        const [wasmLoaderResponse, wasmBinaryResponse, modelBuffer] = await Promise.all([
            fetchWithCache(wasmLoaderPath),
            fetchWithCache(wasmBinaryPath),
            getCachedModelBuffer(modelPath),
        ]);

        const [wasmLoaderBlob, wasmBinaryBlob] = await Promise.all([
            wasmLoaderResponse.blob(),
            wasmBinaryResponse.blob(),
        ]);

        const wasmLoaderUrl = URL.createObjectURL(wasmLoaderBlob);
        const wasmBinaryUrl = URL.createObjectURL(wasmBinaryBlob);

        const configuredDelegate = this.options.segmenterOptions?.delegate;
        const desiredDelegate: 'GPU' | 'CPU' =
            configuredDelegate === 'GPU' || configuredDelegate === 'CPU' ? configuredDelegate : 'GPU';

        const worker = new Worker(
            /* webpackChunkName: "background-segmenter-worker" */
            new URL('./segmenter.worker.ts', import.meta.url),
            { type: 'module' }
        );

        this.worker = worker;

        try {
            await withTimeout(
                new Promise<void>((resolve, reject) => {
                    worker.onmessage = (event: MessageEvent) => {
                        if (event.data?.type === 'ready') {
                            this.activeDelegate = event.data.delegate;
                            this.workerReady = true;
                            worker.onmessage = (e: MessageEvent) => this.handleWorkerMessage(e);
                            // Surface a post-init crash as an initialization failure.
                            worker.onerror = (e: ErrorEvent) => {
                                this.rejectApplied(new Error(`Background segmenter worker error: ${e.message}`));
                            };
                            // eslint-disable-next-line no-console
                            console.log(
                                `[bg-processor] worker ready delegate=${event.data.delegate} model=${modelPath
                                    .split('/')
                                    .pop()}`
                            );
                            resolve();
                        } else if (event.data?.type === 'error') {
                            reject(new Error(event.data.message ?? 'worker init failed'));
                        }
                    };
                    // Reject on worker failure so a crashed/failed init can't hang forever.
                    worker.onerror = (event: ErrorEvent) => {
                        reject(new Error(`Background segmenter worker error: ${event.message}`));
                    };

                    worker.postMessage(
                        {
                            type: 'init',
                            wasmLoaderUrl,
                            wasmBinaryUrl,
                            modelBuffer,
                            delegate: desiredDelegate,
                            constantOverrides: this.getWorkerConstantOverrides(),
                        },
                        [modelBuffer]
                    );
                }),
                'Background segmenter worker init',
                10000
            );
        } catch (error) {
            this.teardownWorker();
            this.rejectApplied(error instanceof Error ? error : new Error('Background processor worker init failed'));
            throw error;
        } finally {
            // Safe to revoke: the worker has loaded both blobs by ready/failure.
            URL.revokeObjectURL(wasmLoaderUrl);
            URL.revokeObjectURL(wasmBinaryUrl);
        }
    }

    private handleWorkerMessage(event: MessageEvent) {
        const msg = event.data;
        if (!msg) {
            return;
        }
        const pending = this.pendingSegmentation;
        if (msg.type === 'mask') {
            // Match by id so a late reply for a superseded or warmup request is
            // dropped instead of being applied to the wrong frame.
            if (pending && pending.id === msg.id) {
                this.pendingSegmentation = null;
                const mask = new Float32Array(msg.buffer as ArrayBuffer);
                pending.resolve({ mask, width: msg.width, height: msg.height });
            }
        } else if (msg.type === 'mask-failed') {
            if (pending && pending.id === msg.id) {
                this.pendingSegmentation = null;
                pending.resolve(null);
            }
        }
    }

    private teardownWorker() {
        if (this.pendingSegmentation) {
            // Unblock any transform() currently awaiting a mask.
            this.pendingSegmentation.resolve(null);
            this.pendingSegmentation = null;
        }
        if (this.worker) {
            try {
                this.worker.postMessage({ type: 'destroy' });
            } catch {
                // ignore
            }
            this.worker.terminate();
            this.worker = null;
        }
        this.workerReady = false;
    }

    async destroy() {
        // Invalidate image decodes that started against the compositor being torn down.
        this.modeGeneration += 1;
        await super.destroy();
        this.teardownWorker();
        // Unblock any pending UI waiters (teardown isn't a failure, so resolve).
        this.resolveApplied();
        this.initializationError = null;
        this.consecutiveMaskFailures = 0;
        this.hasInitialMask = false;
        this.isFirstFrame = true;
        this.maskRequestInFlight = false;
        this.framesSinceSegmentation = 0;
        this.lastOutputFrameTimeMs = 0;
        this.orientationCanvas = null;
        this.orientationContext = null;
        this.settingsSize = null;
        this.isReorienting = false;
        this.segmentationCanvas = null;
        this.segmentationContext = null;
        this.backgroundSwapsInFlight.clear();
        this.appliedBackgroundKey = null;
        this.appliedBlurRadius = null;
        this.appliedCompositor = null;
        this.backgroundBitmaps.forEach((bitmap) => bitmap.close());
        this.backgroundBitmaps.clear();
        this.cleanupWebGLResources();
        this.resetMaskState();
    }

    private cleanupWebGLResources() {
        if (!this.maskGl) {
            return;
        }

        this.maskGl.deleteProgram(this.maskShaderProgram as WebGLProgram);
        this.maskGl.deleteBuffer(this.maskVertexBuffer as WebGLBuffer);
        this.maskGl.deleteFramebuffer(this.maskFramebuffer as WebGLFramebuffer);
        this.maskGl.deleteTexture(this.maskOutputTexture as WebGLTexture);

        if (this.maskMorphTextureA) {
            this.maskGl.deleteTexture(this.maskMorphTextureA);
        }
        if (this.maskMorphTextureB) {
            this.maskGl.deleteTexture(this.maskMorphTextureB);
        }
        if (this.maskInputTexture) {
            this.maskGl.deleteTexture(this.maskInputTexture);
        }
        if (this.maskInputPbo) {
            this.maskGl.deleteBuffer(this.maskInputPbo);
        }

        this.maskShaderProgram = null;
        this.maskVertexBuffer = null;
        this.maskFramebuffer = null;
        this.maskOutputTexture = null;
        this.maskMorphTextureA = null;
        this.maskMorphTextureB = null;
        this.maskInputTexture = null;
        this.maskInputPbo = null;
        this.maskUniformLocations = null;
        this.maskAttribLocations = null;
        this.maskWidth = 0;
        this.maskHeight = 0;
        this.maskGl = null;
        this.maskGlCanvas = null;
    }

    private resetMaskState() {
        this.maskWidth = 0;
        this.maskHeight = 0;
        this.lastCanvasWidth = 0;
        this.lastCanvasHeight = 0;
    }

    // Opaque-black VideoFrame matching the input size. The backing canvas is
    // reused and only reallocated on resolution changes; the caller still owns `frame`.
    private createBlackFrame(frame: VideoFrame): VideoFrame {
        const width = frame.displayWidth;
        const height = frame.displayHeight;
        if (
            !this.blackFrameCanvas ||
            this.blackFrameCanvas.width !== width ||
            this.blackFrameCanvas.height !== height
        ) {
            this.blackFrameCanvas = new OffscreenCanvas(width, height);
            const ctx = this.blackFrameCanvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, width, height);
            }
        }
        return new VideoFrame(this.blackFrameCanvas, {
            timestamp: frame.timestamp ?? Math.round(Date.now() * 1000),
        });
    }

    // Mobile stops asking for masks while the page is hidden. Compositing carries on
    // against the last mask: disabling the processor would enqueue the raw frame and
    // publish the unprocessed background to everyone still watching.
    private isSegmentationPaused() {
        return !!this.options.isMobile && typeof document !== 'undefined' && document.visibilityState === 'hidden';
    }

    private shouldRequestMask() {
        if (this.maskRequestInFlight) {
            return false;
        }
        // Nothing composites until this init() has a mask, so keep asking for it even
        // while hidden. Bounded by the output frame cap like any other request.
        if (!this.hasInitialMask) {
            return true;
        }
        if (this.isSegmentationPaused()) {
            return false;
        }
        return this.framesSinceSegmentation >= this.segmentationFrameInterval - 1;
    }

    // The element's own dimensions are the size the browser presents at, but they
    // only settle once metadata loads; fall back to the size captured at init.
    private getPresentedSize(): { width: number; height: number } | null {
        const video = this.inputVideo;

        if (video && video.videoWidth > 0 && video.videoHeight > 0) {
            return { width: video.videoWidth, height: video.videoHeight };
        }

        return this.settingsSize;
    }

    /**
     * On iOS the VideoFrame comes from the element's coded buffer without the
     * rotation the element applies when presenting it, so an upright iPhone shows a
     * 720x1280 picture built from 1280x720 frames lying on their side. Republishing
     * those through a canvas would put sideways video on the wire.
     *
     * Redrawing the element rather than the frame avoids having to work out which
     * way it is turned, since drawImage applies that rotation for us.
     */
    private createDisplayOrientedFrame(frame: VideoFrame): VideoFrame | null {
        this.isReorienting = false;

        if (!this.needsIosOrientationWorkaround) {
            return null;
        }

        const video = this.inputVideo;
        const presented = this.getPresentedSize();

        if (!video || !presented) {
            return null;
        }

        const { width, height } = presented;
        const isTransposed = width !== height && width === frame.displayHeight && height === frame.displayWidth;

        if (!isTransposed) {
            return null;
        }

        if (
            !this.orientationCanvas ||
            this.orientationCanvas.width !== width ||
            this.orientationCanvas.height !== height
        ) {
            this.orientationCanvas = new OffscreenCanvas(width, height);
            this.orientationContext = this.orientationCanvas.getContext('2d');
        }

        if (!this.orientationContext) {
            return null;
        }

        try {
            this.orientationContext.drawImage(video, 0, 0, width, height);

            const orientedFrame = new VideoFrame(this.orientationCanvas, {
                timestamp: frame.timestamp ?? Math.round(Date.now() * 1000),
            });
            this.isReorienting = true;

            return orientedFrame;
        } catch {
            return null;
        }
    }

    // Downscaling the reoriented surface for the segmenter would read it a second
    // time. Drawing the element straight to segmentation size skips that, and
    // carries the same rotation either way.
    private drawSegmentationSource(frame: VideoFrame): OffscreenCanvas | null {
        const video = this.inputVideo;
        const resizeOptions = this.getResizeOptions(frame);
        const width = resizeOptions?.resizeWidth;
        const height = resizeOptions?.resizeHeight;

        if (!this.isReorienting || !video || !width || !height) {
            return null;
        }

        if (
            !this.segmentationCanvas ||
            this.segmentationCanvas.width !== width ||
            this.segmentationCanvas.height !== height
        ) {
            this.segmentationCanvas = new OffscreenCanvas(width, height);
            this.segmentationContext = this.segmentationCanvas.getContext('2d');
        }

        if (!this.segmentationContext) {
            return null;
        }

        this.segmentationContext.drawImage(video, 0, 0, width, height);

        return this.segmentationCanvas;
    }

    // Dropping (not enqueueing) is what makes the output track run at the lower rate.
    // The cap applies from the first real frame, warmup included: exempting warmup
    // would buy one frame interval of first-mask latency in exchange for segmenting
    // at camera rate for as long as no mask applies, and a pipeline whose masks are
    // failing is exactly the one that can least afford it.
    private shouldDropFrame(frameTimeMs: number) {
        if (this.minOutputFrameIntervalMs === 0 || this.isFirstFrame) {
            return false;
        }
        return frameTimeMs - this.lastOutputFrameTimeMs < this.minOutputFrameIntervalMs;
    }

    async transform(frame: VideoFrame, controller: TransformStreamDefaultController<VideoFrame>) {
        let sourceFrame = frame;
        let sourceFrameTransferred = false;
        try {
            if (!(frame instanceof VideoFrame) || frame.codedWidth === 0 || frame.codedHeight === 0) {
                // Empty frame detected, ignoring
                return;
            }

            // Reorientation applies to passthrough too, but only on the fallback path:
            // it republishes even disabled frames through its own canvas, which would
            // otherwise put the camera on its side the moment the effect is turned off.
            // The stream path passes disabled frames straight through, so reorienting
            // them would just cost a full-size canvas copy per frame for nothing.
            const shouldReorient = !this.isDisabled || !ProcessorWrapper.hasModernApiSupport;
            const orientedFrame = shouldReorient ? this.createDisplayOrientedFrame(frame) : null;
            if (orientedFrame) {
                frame.close();
                sourceFrame = orientedFrame;
            }

            if (this.isDisabled) {
                controller.enqueue(sourceFrame);
                sourceFrameTransferred = true;
                return;
            }

            // Compositing mid-swap would show the gap between the outgoing and
            // incoming background; a dropped frame is invisible, that gap is not.
            if (this.isRebuildingCompositor || this.backgroundSwapsInFlight.size > 0) {
                return;
            }

            const frameTimeMs = Date.now();

            if (this.shouldDropFrame(frameTimeMs)) {
                return;
            }

            this.lastOutputFrameTimeMs = frameTimeMs;

            if (!this.canvas) {
                throw TypeError('Canvas needs to be initialized first');
            }
            if (
                this.lastCanvasWidth !== sourceFrame.displayWidth ||
                this.lastCanvasHeight !== sourceFrame.displayHeight
            ) {
                await this.resizeOutputCanvas(sourceFrame.displayWidth, sourceFrame.displayHeight);
            }

            if (this.isFirstFrame) {
                this.isFirstFrame = false;
                controller.enqueue(this.createBlackFrame(sourceFrame));

                if (this.inputVideo) {
                    try {
                        const videoFrameCallbackPromise = new Promise<void>((resolve) => {
                            this.inputVideo!.requestVideoFrameCallback((_now, e) => {
                                const durationUntilFrameRenderedInMs = e.expectedDisplayTime - e.presentationTime;
                                setTimeout(resolve, durationUntilFrameRenderedInMs);
                            });
                        });
                        // Add timeout to prevent infinite hang if video callback never fires
                        await withTimeout(
                            videoFrameCallbackPromise,
                            'Video frame callback timeout on first frame',
                            5000
                        );
                    } catch {
                        // Timeout or error - continue without waiting
                    }
                }

                // Prime the segmenter so the first composited frame doesn't pay the
                // one-off cold-start inference cost. Fire-and-forget on a clone.
                this.warmUpWorker(sourceFrame.clone());
                return;
            }

            // Segment THIS frame and wait for its mask before compositing, so the
            // mask and the frame content are from the same instant — this is what
            // removes the trailing lag. The await yields the main thread to the
            // worker; inference never runs here. Stream backpressure means we
            // always pick up the most recent frame rather than a queued stale one.
            //
            // Only one request may be in flight: on the serial stream path this is
            // always the case, but the fallback render loop overlaps transform()
            // calls. Overlapping frames skip the request and reuse the latest mask
            // (drawFrame composites with whatever uploadCombinedMask last set),
            // which keeps the mask updating at the worker's throughput instead of
            // freezing it under a backlog.
            //
            // Mobile additionally paces requests to one every segmentationFrameInterval
            // composited frames, the ones in between reusing the mask the same way. The
            // request is still awaited, so the frame that triggers it gets a mask of
            // itself and staleness alternates between none and one frame.
            if (this.shouldRequestMask()) {
                this.framesSinceSegmentation = 0;
                this.maskRequestInFlight = true;

                let maskApplied = false;
                let maskFailure: unknown;

                try {
                    const segmentation = await this.requestMask(sourceFrame);
                    // The upload bails out on any GL failure, leaving LiveKit with the
                    // previous mask (or none), so it must not count as applied.
                    maskApplied = segmentation
                        ? await this.uploadCombinedMask(segmentation.mask, segmentation.width, segmentation.height)
                        : false;
                } catch (error) {
                    // The upload drives raw WebGL on LiveKit's context, so it can throw rather
                    // than return false. Escaping here would skip the accounting below and land
                    // in transform()'s catch-all, stalling initialization silently and forever.
                    maskFailure = error;
                } finally {
                    this.maskRequestInFlight = false;
                }

                if (maskApplied) {
                    this.hasInitialMask = true;
                    this.consecutiveMaskFailures = 0;
                } else if (!this.hasInitialMask) {
                    // Segmentation failed before it ever applied; give up after
                    // too many consecutive failures.
                    this.consecutiveMaskFailures += 1;
                    if (maskFailure && this.consecutiveMaskFailures === 1) {
                        // First failure of a streak; transform()'s catch-all would hide it.
                        // eslint-disable-next-line no-console
                        console.error('[bg-processor] mask pipeline threw', maskFailure);
                    }
                    if (this.consecutiveMaskFailures >= CONSECUTIVE_MASK_FAILURE_LIMIT) {
                        this.rejectApplied(
                            new Error(
                                maskFailure instanceof Error
                                    ? `Background segmentation repeatedly failed: ${maskFailure.message}`
                                    : 'Background segmentation repeatedly failed'
                            )
                        );
                    }
                }
            } else {
                this.framesSinceSegmentation += 1;
            }

            try {
                this.drawFrame(sourceFrame);
                const canRender = this.canvas && this.canvas.width > 0 && this.canvas.height > 0 && this.hasInitialMask;

                if (canRender) {
                    const newFrame = new VideoFrame(this.canvas, {
                        // VideoFrame.timestamp is microseconds; convert the Date.now() (ms)
                        // fallback so units match, and only fall back when it's truly absent.
                        timestamp: sourceFrame.timestamp ?? Math.round(frameTimeMs * 1000),
                    });
                    // Firefox uses LiveKit's canvas fallback, whose enqueue callback draws and closes
                    // the VideoFrame synchronously, so resolving afterwards would observe an already
                    // closed frame. Mark initialization complete before handing ownership over: the
                    // mask has been applied and the composited frame created successfully by now.
                    if (isFirefox()) {
                        this.resolveApplied();
                        controller.enqueue(newFrame);
                    } else {
                        controller.enqueue(newFrame);
                        this.resolveApplied();
                    }
                } else {
                    // No mask yet (worker warming up or a transient failure). Emit an
                    // opaque black frame instead of the raw camera frame so the
                    // unprocessed background is never visible before it kicks in.
                    controller.enqueue(this.createBlackFrame(sourceFrame));
                }
            } finally {
                // The mask reached LiveKit, so initialization is done even if compositing then
                // threw. rejectApplied() is a no-op from here on, so this is the only way out.
                if (this.hasInitialMask) {
                    this.resolveApplied();
                }
            }
        } catch {
            // Ignore
        } finally {
            if (!sourceFrameTransferred) {
                sourceFrame.close();
            }
        }
    }

    private getResizeOptions(frame: VideoFrame): ImageBitmapOptions | undefined {
        // Downscale before handing the frame to the worker: MediaPipe upsamples
        // the masks back to the input resolution, so capping the longest edge bounds
        // transfer/upload cost. Capable devices get a higher cap to keep
        // thin features. Aspect ratio is preserved.
        const maxEdge = this.segmentationInputMaxEdge;
        const longestEdge = Math.max(frame.displayWidth, frame.displayHeight);
        const scale = longestEdge > maxEdge ? maxEdge / longestEdge : 1;
        if (scale >= 1) {
            return undefined;
        }
        return {
            resizeWidth: Math.max(1, Math.round(frame.displayWidth * scale)),
            resizeHeight: Math.max(1, Math.round(frame.displayHeight * scale)),
            resizeQuality: getSegmentationResizeQuality(this.options),
        };
    }

    // Run segmentation for a single frame and resolve with its mask. Resolves
    // null if the worker isn't ready, the bitmap can't be created, or the worker
    // reports a failure / times out — callers then keep the previous mask.
    private async requestMask(frame: VideoFrame): Promise<SegmentationResult | null> {
        const worker = this.worker;
        if (!this.workerReady || !worker) {
            return null;
        }

        let bitmap: ImageBitmap;
        try {
            // createImageBitmap on a VideoFrame is cheap (~1ms) and produces a
            // transferable. Awaiting it here keeps `frame` alive until it's done.
            const segmentationSource = this.drawSegmentationSource(frame);

            bitmap = segmentationSource
                ? await createImageBitmap(segmentationSource)
                : await createImageBitmap(frame, this.getResizeOptions(frame));
        } catch {
            return null;
        }
        if (!this.worker) {
            bitmap.close();
            return null;
        }

        const id = ++this.segmentRequestId;
        const maskPromise = new Promise<SegmentationResult | null>((resolve) => {
            // Only one request is ever in flight (transform awaits each one), so a
            // single pending slot suffices; replies are matched by id.
            this.pendingSegmentation = { id, resolve };
            worker.postMessage({ type: 'segment', bitmap, timestamp: performance.now(), id }, [bitmap]);
        });

        try {
            return await withTimeout(maskPromise, 'Background segmentation', SEGMENTATION_TIMEOUT_MS);
        } catch {
            // Timed out: clear the slot so the eventual late reply is ignored.
            if (this.pendingSegmentation?.id === id) {
                this.pendingSegmentation = null;
            }
            return null;
        }
    }

    // Fire-and-forget warmup inference. Takes ownership of the passed frame
    // (expected to be a clone) and closes it once the bitmap has been created.
    private warmUpWorker(frame: VideoFrame) {
        const worker = this.worker;
        if (!this.workerReady || !worker) {
            frame.close();
            return;
        }
        createImageBitmap(frame, this.getResizeOptions(frame))
            .then((bitmap) => {
                frame.close();
                if (!this.worker) {
                    bitmap.close();
                    return;
                }
                // id 0 never matches a real request, so the result is ignored.
                worker.postMessage({ type: 'segment', bitmap, timestamp: performance.now(), id: 0 }, [bitmap]);
            })
            .catch(() => {
                frame.close();
            });
    }

    async update(opts: Partial<BackgroundProcessorOptions>) {
        this.options = { ...this.options, ...opts };
        if (opts.mode) {
            this.mode = opts.mode;
        }
        await this.applyMode(this.mode);
    }

    private drawFrame(frame: VideoFrame) {
        this.gl?.renderFrame(frame);
    }

    private compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
        const shader = gl.createShader(type);
        if (!shader) {
            return null;
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    private createMaskShaderProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
        const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
        if (!vertexShader) {
            return null;
        }

        // The morphology radius ceiling is compiled in as a loop bound; build the
        // fragment source from the current (possibly overridden) value so the
        // debug tuner can change it live.
        const shaderMaxRadius = this.getShaderMaxRadius();
        const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, buildFragmentShaderSource(shaderMaxRadius));
        if (!fragmentShader) {
            gl.deleteShader(vertexShader);
            return null;
        }

        const program = gl.createProgram();
        if (!program) {
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            return null;
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        // Clean up shaders after linking
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    private saveWebGLState(gl: WebGL2RenderingContext) {
        // Units this pass mutates: 0 (mask input / morphology) and
        // TEXTURE_UNIT_OUTPUT.
        const textureUnits = [0, TEXTURE_UNIT_OUTPUT];
        const textures = textureUnits.map((unit) => {
            gl.activeTexture(gl.TEXTURE0 + unit);
            return gl.getParameter(gl.TEXTURE_BINDING_2D) as WebGLTexture | null;
        });
        return {
            program: gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null,
            framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null,
            arrayBuffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING) as WebGLBuffer | null,
            pixelUnpackBuffer: gl.getParameter(gl.PIXEL_UNPACK_BUFFER_BINDING) as WebGLBuffer | null,
            activeTexture: gl.getParameter(gl.ACTIVE_TEXTURE) as number,
            viewport: gl.getParameter(gl.VIEWPORT) as Int32Array,
            textureUnits,
            textures,
        };
    }

    private restoreWebGLState(
        gl: WebGL2RenderingContext,
        state: ReturnType<BackgroundProcessorTransformer['saveWebGLState']>
    ) {
        // Set the active unit before each bind so the saved texture lands on the
        // unit it came from, then restore the originally active unit.
        state.textureUnits.forEach((unit, i) => {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, state.textures[i]);
        });
        gl.activeTexture(state.activeTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, state.framebuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, state.arrayBuffer);
        gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, state.pixelUnpackBuffer);
        gl.useProgram(state.program);
        gl.viewport(state.viewport[0], state.viewport[1], state.viewport[2], state.viewport[3]);
    }

    private initializeShaderResources(gl: WebGL2RenderingContext) {
        if (this.maskShaderProgram) {
            return true;
        }

        this.maskShaderProgram = this.createMaskShaderProgram(gl);
        if (!this.maskShaderProgram) {
            return false;
        }

        // Resolve attribute/uniform locations once at link time rather than every
        // frame. The combined mask is always sampled from texture unit 0, so its
        // sampler binding is set here and never changes.
        gl.useProgram(this.maskShaderProgram);
        this.maskUniformLocations = {
            mask: gl.getUniformLocation(this.maskShaderProgram, 'u_mask'),
            blurStep: gl.getUniformLocation(this.maskShaderProgram, 'u_blurStep'),
            invert: gl.getUniformLocation(this.maskShaderProgram, 'u_invert'),
            mode: gl.getUniformLocation(this.maskShaderProgram, 'u_mode'),
            radius: gl.getUniformLocation(this.maskShaderProgram, 'u_radius'),
        };
        this.maskAttribLocations = {
            position: gl.getAttribLocation(this.maskShaderProgram, 'a_position'),
            texCoord: gl.getAttribLocation(this.maskShaderProgram, 'a_texCoord'),
        };

        gl.uniform1i(this.maskUniformLocations.mask, 0);

        // Create vertex buffer for quad
        this.maskVertexBuffer = gl.createBuffer();
        if (this.maskVertexBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.maskVertexBuffer);
            const vertices = new Float32Array(VERTICES);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        }

        return true;
    }

    private uploadCombinedMaskTexture(
        gl: WebGL2RenderingContext,
        mask: Float32Array,
        width: number,
        height: number,
        sizeChanged: boolean
    ): boolean {
        if (!this.maskInputTexture) {
            this.maskInputTexture = gl.createTexture();
        }
        if (!this.maskInputPbo) {
            this.maskInputPbo = gl.createBuffer();
        }
        if (!this.maskInputTexture || !this.maskInputPbo) {
            return false;
        }

        gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, this.maskInputPbo);
        if (sizeChanged) {
            gl.bufferData(gl.PIXEL_UNPACK_BUFFER, mask.byteLength, gl.STREAM_DRAW);
        }
        gl.bufferSubData(gl.PIXEL_UNPACK_BUFFER, 0, mask);

        // The combined person-confidence mask lives on texture unit 0, matching
        // the u_mask sampler binding configured in initializeShaderResources().
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.maskInputTexture);

        if (sizeChanged) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, width, height, 0, gl.RED, gl.FLOAT, 0);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        } else {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RED, gl.FLOAT, 0);
        }

        gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);

        return true;
    }

    private ensureOutputTexture(
        gl: WebGL2RenderingContext,
        width: number,
        height: number,
        sizeChanged: boolean
    ): boolean {
        gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNIT_OUTPUT);

        if (!this.maskOutputTexture) {
            this.maskOutputTexture = gl.createTexture();
            if (!this.maskOutputTexture) {
                return false;
            }
            gl.bindTexture(gl.TEXTURE_2D, this.maskOutputTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, this.maskOutputTexture);
        }

        if (sizeChanged) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }

        return true;
    }

    // Lazily create the morphology ping-pong pair. NEAREST (min/max read exact
    // texels) and RGBA8 (min/max don't accumulate error). Bound on unit 0, which
    // saveWebGLState snapshots.
    private ensureMorphTextures(
        gl: WebGL2RenderingContext,
        width: number,
        height: number,
        sizeChanged: boolean
    ): boolean {
        gl.activeTexture(gl.TEXTURE0);

        for (const which of ['A', 'B'] as const) {
            const key = which === 'A' ? 'maskMorphTextureA' : 'maskMorphTextureB';
            let texture = this[key];
            if (!texture) {
                texture = gl.createTexture();
                if (!texture) {
                    return false;
                }
                this[key] = texture;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            } else {
                gl.bindTexture(gl.TEXTURE_2D, texture);
            }

            if (sizeChanged) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            }
        }

        return true;
    }

    private configureShaderProgram(gl: WebGL2RenderingContext) {
        if (!this.maskShaderProgram || !this.maskUniformLocations || !this.maskAttribLocations) {
            return false;
        }

        gl.useProgram(this.maskShaderProgram);

        if (this.maskVertexBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.maskVertexBuffer);
            gl.enableVertexAttribArray(this.maskAttribLocations.position);
            gl.vertexAttribPointer(this.maskAttribLocations.position, 2, gl.FLOAT, false, 16, 0);
            gl.enableVertexAttribArray(this.maskAttribLocations.texCoord);
            gl.vertexAttribPointer(this.maskAttribLocations.texCoord, 2, gl.FLOAT, false, 16, 8);
        }

        return true;
    }

    // One full-screen mask pass: render `source` (unit 0) into `target` with the
    // given uniforms. Framebuffer and viewport must be set by the caller.
    private drawMaskPass(
        gl: WebGL2RenderingContext,
        target: WebGLTexture,
        source: WebGLTexture,
        stepX: number,
        stepY: number,
        mode: number,
        invert: boolean,
        radius: number
    ): boolean {
        if (!this.maskUniformLocations) {
            return false;
        }
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            return false;
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, source);
        gl.uniform2f(this.maskUniformLocations.blurStep, stepX, stepY);
        gl.uniform1i(this.maskUniformLocations.invert, invert ? 1 : 0);
        gl.uniform1i(this.maskUniformLocations.mode, mode);
        gl.uniform1i(this.maskUniformLocations.radius, radius);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return true;
    }

    // Optional morphological close (dilate then erode, leaving the result in
    // maskMorphTextureB) to fill transient interior holes, then a single
    // copy pass that inverts the person mask into the output texture LiveKit
    // composites with. Every pass samples unit 0.
    private renderMask(gl: WebGL2RenderingContext, width: number, height: number): boolean {
        if (!this.maskFramebuffer) {
            this.maskFramebuffer = gl.createFramebuffer();
        }

        if (
            !this.maskFramebuffer ||
            !this.maskOutputTexture ||
            !this.maskInputTexture ||
            !this.maskUniformLocations ||
            !this.gl
        ) {
            return false;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.maskFramebuffer);
        gl.viewport(0, 0, width, height);

        // The copy reads the raw upload unless closing produces a filled mask.
        let maskSource: WebGLTexture = this.maskInputTexture;

        const closingEnabled = this.maskClosingRadius > 0 && !!this.maskMorphTextureA && !!this.maskMorphTextureB;
        if (closingEnabled) {
            const a = this.maskMorphTextureA!;
            const b = this.maskMorphTextureB!;
            const radius = this.maskClosingRadius;
            // One-texel step; the shader applies the radius per-tap via u_radius.
            const texelX = width > 0 ? 1 / width : 0;
            const texelY = height > 0 ? 1 / height : 0;

            // Dilate (max): input -H-> A -V-> B.
            if (!this.drawMaskPass(gl, a, this.maskInputTexture, texelX, 0, MASK_PASS_DILATE, false, radius)) {
                return false;
            }
            if (!this.drawMaskPass(gl, b, a, 0, texelY, MASK_PASS_DILATE, false, radius)) {
                return false;
            }
            // Erode (min): B -H-> A -V-> B, leaving the closed mask in B.
            if (!this.drawMaskPass(gl, a, b, texelX, 0, MASK_PASS_ERODE, false, radius)) {
                return false;
            }
            if (!this.drawMaskPass(gl, b, a, 0, texelY, MASK_PASS_ERODE, false, radius)) {
                return false;
            }
            maskSource = b;
        }

        if (!this.drawMaskPass(gl, this.maskOutputTexture, maskSource, 0, 0, MASK_PASS_COPY, true, 0)) {
            return false;
        }

        this.gl.updateMask(this.maskOutputTexture);

        return true;
    }

    /**
     * Upload the pre-combined person-confidence mask produced by the segmenter
     * worker, optionally close it to fill interior holes, and invert it into the
     * texture LiveKit composites with.
     *
     * The class combine (multiclass person = 1 - background, where background is
     * class 0 of the softmax over hair/body/face/clothes/accessories) now happens
     * on the worker thread, so a single R32F mask arrives here instead of up to six.
     *
     * Reference: https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter
     */
    private async uploadCombinedMask(mask: Float32Array, width: number, height: number): Promise<boolean> {
        if (!mask || mask.length === 0 || !this.gl || !this.canvas || width === 0 || height === 0) {
            return false;
        }

        // Use the WebGL context from the same canvas LiveKit is using so the
        // resulting mask texture can be handed straight to LiveKit's updateMask().
        // Checked per upload rather than at init(), because restart() swaps the
        // compositor too: resources built against the previous canvas would upload
        // into a context LiveKit no longer samples, so every mask would report as
        // applied-but-invisible and the pipeline would never leave warmup.
        if (this.maskGlCanvas && this.maskGlCanvas !== this.canvas) {
            this.cleanupWebGLResources();
            this.resetMaskState();
        }

        if (!this.maskGl && typeof (this.canvas as any).getContext === 'function') {
            this.maskGl = (this.canvas as any).getContext('webgl2') as WebGL2RenderingContext | null;
            this.maskGlCanvas = this.canvas;
        }

        const gl = this.maskGl;
        if (!gl) {
            return false;
        }

        const sizeChanged = this.maskWidth !== width || this.maskHeight !== height;
        const savedState = this.saveWebGLState(gl);

        // Restore LiveKit's GL state on every exit path so a mid-pipeline bail-out
        // can't leave the shared context mutated.
        try {
            if (!this.initializeShaderResources(gl)) {
                return false;
            }

            if (!this.uploadCombinedMaskTexture(gl, mask, width, height, sizeChanged)) {
                return false;
            }

            if (this.maskClosingRadius > 0 && !this.ensureMorphTextures(gl, width, height, sizeChanged)) {
                return false;
            }

            if (!this.ensureOutputTexture(gl, width, height, sizeChanged)) {
                return false;
            }

            if (!this.configureShaderProgram(gl)) {
                return false;
            }

            if (!this.renderMask(gl, width, height)) {
                return false;
            }

            this.maskWidth = width;
            this.maskHeight = height;

            gl.flush();

            return true;
        } finally {
            this.restoreWebGLState(gl, savedState);
        }
    }
}

export const createBackgroundProcessorHandle = (options: BackgroundProcessorOptions): BackgroundProcessor => {
    const transformer = new BackgroundProcessorTransformer(options);
    const processor = createProcessorWrapper<BackgroundOptions>(
        transformer,
        'background-effect',
        options
    ) as BackgroundProcessor;

    processor.enable = () => transformer.enable();
    processor.disable = () => transformer.disable();
    processor.isEnabled = () => transformer.isEnabled();
    processor.getActiveDelegate = () => transformer.activeDelegate;
    processor.waitUntilApplied = () => transformer.waitUntilApplied();
    processor.hasAppliedMask = () => transformer.hasAppliedMask();
    processor.setMode = (mode) => transformer.setMode(mode);

    return processor;
};
