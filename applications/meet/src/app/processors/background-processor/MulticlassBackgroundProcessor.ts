import {
    type BackgroundOptions,
    ProcessorWrapper,
    type ProcessorWrapperOptions,
    type SegmenterOptions,
    VideoTransformer,
    type VideoTransformerInitOptions,
} from '@livekit/track-processors';

import { withTimeout } from '@proton/meet/utils/withTimeout';

import {
    DEFAULT_ASSET_PATH,
    DEFAULT_MODEL_PATH,
    DEFAULT_PERSON_MASK_THRESHOLD,
    FRAGMENT_SHADER_SOURCE,
    LOW_END_PERSON_MASK_THRESHOLD,
    MASK_EDGE_BLUR_TEXEL_RADIUS,
    SEGMENTATION_INPUT_MAX_EDGE,
    TEXTURE_UNIT_MASK,
    TEXTURE_UNIT_OUTPUT,
    VERTEX_SHADER_SOURCE,
    VERTICES,
} from './constants';

export interface BackgroundProcessorOptions extends ProcessorWrapperOptions {
    blurRadius?: number;
    segmenterOptions?: SegmenterOptions;
    assetPaths?: {
        tasksVisionFileSet?: string;
        modelAssetPath?: string;
    };
    isLowEndDevice?: boolean;
}

const CACHE_NAME = 'proton-meet-background-blur-v1';

// Safety net for a wedged worker: if a single frame's mask doesn't come back in
// this long we give up on it (reusing the previous mask) instead of freezing the
// video. Healthy round-trips are tens of milliseconds, so this never trips in
// normal operation.
const SEGMENTATION_TIMEOUT_MS = 2000;

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

export default class MulticlassBackgroundProcessor extends VideoTransformer<BackgroundOptions> {
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

    // Person/background decision threshold fed to the mask shader. Raised on
    // low-end devices to erode the person region and hide the silhouette gap.
    private readonly personMaskThreshold: number;

    private maskTexture?: WebGLTexture | null;
    private maskGl?: WebGL2RenderingContext | null;
    private maskTextureWidth = 0;
    private maskTextureHeight = 0;
    private maskShaderProgram?: WebGLProgram | null;
    private maskVertexBuffer?: WebGLBuffer | null;
    private maskFramebuffer?: WebGLFramebuffer | null;
    private maskOutputTexture?: WebGLTexture | null;
    private maskOutputTextureWidth = 0;
    private maskOutputTextureHeight = 0;
    private lastCanvasWidth = 0;
    private lastCanvasHeight = 0;
    activeDelegate: 'GPU' | 'CPU' | undefined;
    private maskInputTexture?: WebGLTexture | null;
    private maskInputPbo?: WebGLBuffer | null;
    private pixelBufferWidth = 0;
    private pixelBufferHeight = 0;

    // Cached GLSL locations. getUniformLocation/getAttribLocation are resolved
    // once after the program links instead of on every composited frame.
    private maskUniformLocations: {
        texelSize: WebGLUniformLocation | null;
        personThreshold: WebGLUniformLocation | null;
        mask: WebGLUniformLocation | null;
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

    // True while a mask request is awaiting the worker. The stream-processor path
    // (Chrome) applies backpressure so transform() runs strictly serially and this
    // never blocks a request. The fallback requestAnimationFrame path (Firefox /
    // Safari, which lack MediaStreamTrackGenerator) calls transform() WITHOUT
    // awaiting it, so frames overlap; without this guard each overlapping frame
    // would clobber the single pendingSegmentation slot and flood the worker,
    // leaving the mask frozen while the video keeps moving. When a request is
    // already in flight we instead composite with the most recent mask.
    private maskRequestInFlight = false;

    constructor(opts: BackgroundProcessorOptions) {
        super();
        this.options = opts;
        this.personMaskThreshold = opts.isLowEndDevice ? LOW_END_PERSON_MASK_THRESHOLD : DEFAULT_PERSON_MASK_THRESHOLD;
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
        if (this.options.blurRadius) {
            this.gl?.setBlurRadius(this.options.blurRadius);
        }
    }

    private async initializeWorker() {
        // init() may run more than once per instance (e.g. camera switch); tear
        // down any existing worker so we don't orphan it.
        this.teardownWorker();

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
                            // eslint-disable-next-line no-console
                            console.log(
                                `[bg-blur] worker ready delegate=${event.data.delegate} model=${modelPath
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
                        },
                        [modelBuffer]
                    );
                }),
                'Background segmenter worker init',
                10000
            );
        } catch (error) {
            this.teardownWorker();
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

        this.maskGl.deleteTexture(this.maskTexture as WebGLTexture);
        this.maskGl.deleteProgram(this.maskShaderProgram as WebGLProgram);
        this.maskGl.deleteBuffer(this.maskVertexBuffer as WebGLBuffer);
        this.maskGl.deleteFramebuffer(this.maskFramebuffer as WebGLFramebuffer);
        this.maskGl.deleteTexture(this.maskOutputTexture as WebGLTexture);

        if (this.maskInputTexture) {
            this.maskGl.deleteTexture(this.maskInputTexture);
        }
        if (this.maskInputPbo) {
            this.maskGl.deleteBuffer(this.maskInputPbo);
        }

        this.maskTexture = null;
        this.maskShaderProgram = null;
        this.maskVertexBuffer = null;
        this.maskFramebuffer = null;
        this.maskOutputTexture = null;
        this.maskInputTexture = null;
        this.maskInputPbo = null;
        this.maskUniformLocations = null;
        this.maskAttribLocations = null;
        this.pixelBufferWidth = 0;
        this.pixelBufferHeight = 0;
        this.maskGl = null;
    }

    private resetMaskState() {
        this.maskTextureWidth = 0;
        this.maskTextureHeight = 0;
        this.maskOutputTextureWidth = 0;
        this.maskOutputTextureHeight = 0;
        this.lastCanvasWidth = 0;
        this.lastCanvasHeight = 0;
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
                controller.enqueue(frame.clone());

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
            // removes the trailing-blur lag. The await yields the main thread to
            // the worker; inference never runs here. Stream backpressure means we
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
                controller.enqueue(newFrame);
            } else {
                // No mask yet (worker warming up or a transient failure). Pass the
                // original frame through unmodified so the user sees video.
                controller.enqueue(frame);
                originalFrameTransferred = true;
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
        // Downscale before handing the frame to the worker. The model runs at a
        // fixed 256x256 tensor regardless of input size, and MediaPipe upsamples
        // the confidence masks back to the *input* resolution — so a full-res
        // frame produces full-res masks that are expensive to transfer, upload
        // and combine. Capping the longest edge keeps inference quality identical
        // while shrinking all of that downstream work. Aspect ratio is preserved
        // so the model's internal square-resize behaves as before.
        const longestEdge = Math.max(frame.displayWidth, frame.displayHeight);
        const scale = longestEdge > SEGMENTATION_INPUT_MAX_EDGE ? SEGMENTATION_INPUT_MAX_EDGE / longestEdge : 1;
        if (scale >= 1) {
            return undefined;
        }
        return {
            resizeWidth: Math.max(1, Math.round(frame.displayWidth * scale)),
            resizeHeight: Math.max(1, Math.round(frame.displayHeight * scale)),
            resizeQuality: 'low',
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

    async update(opts: BackgroundProcessorOptions) {
        this.options = { ...this.options, ...opts };
        this.gl?.setBlurRadius(opts.blurRadius ?? null);
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

        const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
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
        // Units this pass mutates: 0 (mask input), TEXTURE_UNIT_MASK, TEXTURE_UNIT_OUTPUT.
        const textureUnits = [0, TEXTURE_UNIT_MASK, TEXTURE_UNIT_OUTPUT];
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
        state: ReturnType<MulticlassBackgroundProcessor['saveWebGLState']>
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
            texelSize: gl.getUniformLocation(this.maskShaderProgram, 'u_texelSize'),
            personThreshold: gl.getUniformLocation(this.maskShaderProgram, 'u_personThreshold'),
            mask: gl.getUniformLocation(this.maskShaderProgram, 'u_mask'),
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
        height: number
    ): boolean {
        const sizeChanged = this.pixelBufferWidth !== width || this.pixelBufferHeight !== height;

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

        if (sizeChanged) {
            this.pixelBufferWidth = width;
            this.pixelBufferHeight = height;
        }

        return true;
    }

    private initializeMaskTexture(gl: WebGL2RenderingContext, width: number, height: number) {
        gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNIT_MASK);

        if (!this.maskTexture) {
            this.maskTexture = gl.createTexture();
            if (!this.maskTexture) {
                return false;
            }
            gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            this.maskTextureWidth = 0;
            this.maskTextureHeight = 0;
        } else {
            gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
        }

        if (this.maskTextureWidth !== width || this.maskTextureHeight !== height) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            this.maskTextureWidth = width;
            this.maskTextureHeight = height;
        }

        return true;
    }

    private configureShaderProgram(gl: WebGL2RenderingContext, width: number, height: number) {
        if (!this.maskShaderProgram || !this.maskUniformLocations || !this.maskAttribLocations) {
            return false;
        }

        gl.useProgram(this.maskShaderProgram);

        // u_texelSize is the per-Gaussian-tap offset in UV space. We fold the
        // edge-smoothing radius (in mask texels) into it so the shader can step
        // by a single u_texelSize unit.
        gl.uniform2f(
            this.maskUniformLocations.texelSize,
            MASK_EDGE_BLUR_TEXEL_RADIUS / width,
            MASK_EDGE_BLUR_TEXEL_RADIUS / height
        );
        gl.uniform1f(this.maskUniformLocations.personThreshold, this.personMaskThreshold);

        if (this.maskVertexBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.maskVertexBuffer);
            gl.enableVertexAttribArray(this.maskAttribLocations.position);
            gl.vertexAttribPointer(this.maskAttribLocations.position, 2, gl.FLOAT, false, 16, 0);
            gl.enableVertexAttribArray(this.maskAttribLocations.texCoord);
            gl.vertexAttribPointer(this.maskAttribLocations.texCoord, 2, gl.FLOAT, false, 16, 8);
        }

        return true;
    }

    private renderMaskToFramebuffer(gl: WebGL2RenderingContext, width: number, height: number): boolean {
        if (!this.maskFramebuffer) {
            this.maskFramebuffer = gl.createFramebuffer();
        }

        if (!this.maskFramebuffer || !this.maskTexture) {
            return false;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.maskFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.maskTexture, 0);

        const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (fbStatus !== gl.FRAMEBUFFER_COMPLETE) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return false;
        }

        gl.viewport(0, 0, width, height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        return true;
    }

    private copyMaskToOutputTexture(gl: WebGL2RenderingContext, width: number, height: number) {
        gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNIT_OUTPUT);

        if (!this.maskOutputTexture) {
            this.maskOutputTexture = gl.createTexture();
            if (this.maskOutputTexture) {
                gl.bindTexture(gl.TEXTURE_2D, this.maskOutputTexture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
        }

        if (!this.maskTexture || !this.maskOutputTexture || !this.maskFramebuffer || !this.gl) {
            return;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.maskFramebuffer);
        gl.bindTexture(gl.TEXTURE_2D, this.maskOutputTexture);

        const outputNeedsInit = this.maskOutputTextureWidth !== width || this.maskOutputTextureHeight !== height;
        if (outputNeedsInit) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            this.maskOutputTextureWidth = width;
            this.maskOutputTextureHeight = height;
        }

        gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, width, height);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this.gl.updateMask(this.maskOutputTexture);
    }

    /**
     * Upload the pre-combined person-confidence mask produced by the segmenter
     * worker and feather/invert it into the texture LiveKit composites with.
     *
     * The per-class max() combine (multiclass classes 1-5 = hair/body/face/
     * clothes/accessories) and the hair-detail confidence boost now happen on the
     * worker thread, so a single R32F mask arrives here instead of up to six.
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

        const savedState = this.saveWebGLState(gl);

        if (!this.initializeShaderResources(gl)) {
            return;
        }

        if (!this.uploadCombinedMaskTexture(gl, mask, width, height)) {
            return;
        }

        if (!this.initializeMaskTexture(gl, width, height)) {
            return;
        }

        if (!this.configureShaderProgram(gl, width, height)) {
            return;
        }

        if (!this.renderMaskToFramebuffer(gl, width, height)) {
            return;
        }

        this.copyMaskToOutputTexture(gl, width, height);

        this.restoreWebGLState(gl, savedState);

        gl.flush();
    }
}

export type BackgroundBlurProcessor = ProcessorWrapper<BackgroundOptions> & {
    enable: () => void;
    disable: () => void;
    isEnabled: () => boolean;
    getActiveDelegate: () => 'GPU' | 'CPU' | undefined;
};

export const BackgroundBlur = (
    blurRadius?: number,
    segmenterOptions?: SegmenterOptions,
    processorOptions?: BackgroundProcessorOptions
) => {
    const options: BackgroundProcessorOptions = {
        blurRadius,
        segmenterOptions,
        ...processorOptions,
    };
    const transformer = new MulticlassBackgroundProcessor(options);
    const processor = new ProcessorWrapper<BackgroundOptions>(
        transformer,
        'background-blur',
        processorOptions
    ) as BackgroundBlurProcessor;

    processor.enable = () => transformer.enable();
    processor.disable = () => transformer.disable();
    processor.isEnabled = () => transformer.isEnabled();
    processor.getActiveDelegate = () => transformer.activeDelegate;

    return processor;
};
