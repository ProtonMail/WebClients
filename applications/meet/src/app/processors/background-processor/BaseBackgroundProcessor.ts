import { type BackgroundOptions, VideoTransformer, type VideoTransformerInitOptions } from '@livekit/track-processors';

import { withTimeout } from '@proton/meet/utils/withTimeout';
import { isFirefox } from '@proton/shared/lib/helpers/browser';

import {
    DEFAULT_ASSET_PATH,
    DEFAULT_MODEL_PATH,
    MASK_CLOSING_MAX_RADIUS,
    MASK_CLOSING_RADIUS,
    MASK_CLOSING_RADIUS_LOW_END,
    MASK_PASS_COPY,
    MASK_PASS_DILATE,
    MASK_PASS_ERODE,
    MULTICLASS_PERSON_CONFIDENCE_BOOST,
    PERSON_CONFIDENCE_BOOST,
    SEGMENTATION_INPUT_MAX_EDGE,
    SEGMENTATION_INPUT_MAX_EDGE_HIGH_END,
    TEXTURE_UNIT_OUTPUT,
    VERTEX_SHADER_SOURCE,
    VERTICES,
    buildFragmentShaderSource,
} from './constants';
import { type TunableConstantsOverrides, pickWorkerOverrides } from './tunableConstants';
import type { BaseBackgroundProcessorOptions } from './types';

const CACHE_NAME = 'proton-meet-background-blur-v1';

// Safety net for a wedged worker: if a single frame's mask doesn't come back in
// this long we give up on it (reusing the previous mask) instead of freezing the
// video. Healthy round-trips are tens of milliseconds, so this never trips in
// normal operation.
const SEGMENTATION_TIMEOUT_MS = 2000;

// Consecutive segmentation failures tolerated before the first mask before the
// background initialization is treated as failed.
const CONSECUTIVE_MASK_FAILURE_LIMIT = 500;

type SegmentationResult = { mask: Float32Array; width: number; height: number };

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

/**
 * Shared segmentation + mask-compositing pipeline for every background
 * processor. It runs the MediaPipe segmenter in a worker, uploads and shapes the
 * person-confidence mask on the GPU, and hands the inverted mask to LiveKit's
 * WebGL compositor. Subclasses only decide what the background is (blur vs. a
 * custom image/color) by implementing {@link configureBackground}.
 */
export default abstract class BaseBackgroundProcessor<
    TOptions extends BaseBackgroundProcessorOptions = BaseBackgroundProcessorOptions,
> extends VideoTransformer<BackgroundOptions> {
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

    options: TOptions;

    isFirstFrame = true;

    private maskGl?: WebGL2RenderingContext | null;
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

    private appliedWaiters: { resolve: () => void; reject: (error: Error) => void }[] = [];

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

    constructor(opts: TOptions) {
        super();
        this.options = opts;

        const overrides = opts.constantOverrides;
        const defaultClosingRadius = opts.isLowEndDevice ? MASK_CLOSING_RADIUS_LOW_END : MASK_CLOSING_RADIUS;
        const defaultInputMaxEdge = opts.isLowEndDevice
            ? SEGMENTATION_INPUT_MAX_EDGE
            : SEGMENTATION_INPUT_MAX_EDGE_HIGH_END;

        this.maskClosingRadius = BaseBackgroundProcessor.resolveInt(
            overrides?.maskClosingRadius,
            defaultClosingRadius,
            0
        );
        this.segmentationInputMaxEdge = BaseBackgroundProcessor.resolveInt(
            overrides?.segmentationInputMaxEdge,
            defaultInputMaxEdge,
            1
        );
    }

    protected static resolveInt(override: number | undefined, fallback: number, min: number): number {
        return typeof override === 'number' && Number.isFinite(override)
            ? Math.max(min, Math.round(override))
            : fallback;
    }

    /**
     * Configure LiveKit's compositor with the concrete background this processor
     * produces. Called after the worker is initialized and again on every
     * {@link update}. Blur sets the blur radius; a custom background sets the
     * background image/color.
     */
    protected abstract configureBackground(): void | Promise<void>;

    // Compile-time morphology loop ceiling for the shader. Must be >= the active
    // closing radius; keeps the production default as a floor.
    private getShaderMaxRadius() {
        return Math.max(MASK_CLOSING_MAX_RADIUS, this.maskClosingRadius);
    }

    // Worker-bound overrides for the init message. Person-confidence boosts keep
    // their existing Unleash-sourced defaults (options.*), and any debug-tuner
    // override wins over them.
    private getWorkerConstantOverrides(): TunableConstantsOverrides {
        return {
            personConfidenceBoost: this.options.personConfidenceBoost ?? PERSON_CONFIDENCE_BOOST,
            multiclassPersonConfidenceBoost:
                this.options.multiclassPersonConfidenceBoost ?? MULTICLASS_PERSON_CONFIDENCE_BOOST,
            ...pickWorkerOverrides(this.options.constantOverrides ?? {}),
        };
    }

    // Resolves once the first processed frame is produced (or immediately if it
    // already was), and rejects if initialization explicitly failed.
    waitUntilApplied(): Promise<void> {
        if (this.hasInitialMask) {
            return Promise.resolve();
        }
        if (this.initializationError) {
            return Promise.reject(this.initializationError);
        }
        return new Promise<void>((resolve, reject) => {
            this.appliedWaiters.push({ resolve, reject });
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
        await super.init({ outputCanvas, inputElement: inputVideo });

        await this.initializeWorker();
        await this.configureBackground();
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
            /* webpackChunkName: "background-segmenter-worker-next" */
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
        await super.destroy();
        this.teardownWorker();
        // Unblock any pending UI waiters (teardown isn't a failure, so resolve).
        this.resolveApplied();
        this.initializationError = null;
        this.consecutiveMaskFailures = 0;
        this.hasInitialMask = false;
        this.isFirstFrame = true;
        this.maskRequestInFlight = false;
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

    async transform(frame: VideoFrame, controller: TransformStreamDefaultController<VideoFrame>) {
        let originalFrameTransferred = false;
        try {
            if (!(frame instanceof VideoFrame) || frame.codedWidth === 0 || frame.codedHeight === 0) {
                // Empty frame detected, ignoring
                return;
            }

            if (this.isDisabled) {
                controller.enqueue(frame);
                originalFrameTransferred = true;
                return;
            }

            const frameTimeMs = Date.now();
            if (!this.canvas) {
                throw TypeError('Canvas needs to be initialized first');
            }
            if (this.lastCanvasWidth !== frame.displayWidth || this.lastCanvasHeight !== frame.displayHeight) {
                this.canvas.width = frame.displayWidth;
                this.canvas.height = frame.displayHeight;
                this.lastCanvasWidth = frame.displayWidth;
                this.lastCanvasHeight = frame.displayHeight;
            }

            if (this.isFirstFrame) {
                this.isFirstFrame = false;
                controller.enqueue(this.createBlackFrame(frame));

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
                this.warmUpWorker(frame.clone());
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
            if (!this.maskRequestInFlight) {
                this.maskRequestInFlight = true;
                try {
                    const segmentation = await this.requestMask(frame);
                    if (segmentation) {
                        await this.uploadCombinedMask(segmentation.mask, segmentation.width, segmentation.height);
                        this.hasInitialMask = true;
                        this.consecutiveMaskFailures = 0;
                    } else if (!this.hasInitialMask) {
                        // Segmentation failed before it ever applied; give up after
                        // too many consecutive failures.
                        this.consecutiveMaskFailures += 1;
                        if (this.consecutiveMaskFailures >= CONSECUTIVE_MASK_FAILURE_LIMIT) {
                            this.rejectApplied(new Error('Background segmentation repeatedly failed'));
                        }
                    }
                } finally {
                    this.maskRequestInFlight = false;
                }
            }

            this.drawFrame(frame);
            const canRender = this.canvas && this.canvas.width > 0 && this.canvas.height > 0 && this.hasInitialMask;

            if (canRender) {
                const newFrame = new VideoFrame(this.canvas, {
                    // VideoFrame.timestamp is microseconds; convert the Date.now() (ms)
                    // fallback so units match, and only fall back when it's truly absent.
                    timestamp: frame.timestamp ?? Math.round(frameTimeMs * 1000),
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
                controller.enqueue(this.createBlackFrame(frame));
            }
        } catch {
            // Ignore
        } finally {
            if (!originalFrameTransferred) {
                frame.close();
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
            // 'high' preserves fine detail (hair, fingers, edges) when downscaling;
            // low-end stays on 'medium' to bound cost.
            resizeQuality: this.options.isLowEndDevice ? 'medium' : 'high',
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
            bitmap = await createImageBitmap(frame, this.getResizeOptions(frame));
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

    async update(opts: Partial<TOptions>) {
        this.options = { ...this.options, ...opts };
        await this.configureBackground();
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
        state: ReturnType<BaseBackgroundProcessor['saveWebGLState']>
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
    private async uploadCombinedMask(mask: Float32Array, width: number, height: number) {
        if (!mask || mask.length === 0 || !this.gl || !this.canvas || width === 0 || height === 0) {
            return;
        }

        // Use the WebGL context from the same canvas LiveKit is using so the
        // resulting mask texture can be handed straight to LiveKit's updateMask().
        if (!this.maskGl && typeof (this.canvas as any).getContext === 'function') {
            this.maskGl = (this.canvas as any).getContext('webgl2') as WebGL2RenderingContext | null;
        }

        const gl = this.maskGl;
        if (!gl) {
            return;
        }

        const sizeChanged = this.maskWidth !== width || this.maskHeight !== height;
        const savedState = this.saveWebGLState(gl);

        // Restore LiveKit's GL state on every exit path so a mid-pipeline bail-out
        // can't leave the shared context mutated.
        try {
            if (!this.initializeShaderResources(gl)) {
                return;
            }

            if (!this.uploadCombinedMaskTexture(gl, mask, width, height, sizeChanged)) {
                return;
            }

            if (this.maskClosingRadius > 0 && !this.ensureMorphTextures(gl, width, height, sizeChanged)) {
                return;
            }

            if (!this.ensureOutputTexture(gl, width, height, sizeChanged)) {
                return;
            }

            if (!this.configureShaderProgram(gl)) {
                return;
            }

            if (!this.renderMask(gl, width, height)) {
                return;
            }

            this.maskWidth = width;
            this.maskHeight = height;

            gl.flush();
        } finally {
            this.restoreWebGLState(gl, savedState);
        }
    }
}
