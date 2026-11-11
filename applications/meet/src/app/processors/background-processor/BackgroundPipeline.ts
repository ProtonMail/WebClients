import { type Compositor, createCompositor } from './compositor';
import { LOADING_FRAMES_PER_SECOND, drawLoadingFrame } from './loadingFrame';
import { MaskShaper } from './maskShaper';
import { SEGMENTATION_TIMEOUT_MS, type SegmentationClient, type SegmentationResult } from './segmentationClient';
import type { BackgroundDebugView, PipelineLogger } from './types';

// Two frames in flight keep the next mask request queued while the current frame composites.
const PIPELINE_DEPTH = 2;

const CONSECUTIVE_MASK_FAILURE_LIMIT = 500;

// WebRTC drops a frame whose capture time does not move forward, compared in milliseconds.
const MIN_OUTPUT_TIMESTAMP_STEP_US = 1000;

const BLANK_CHECK_WIDTH = 16;
const BLANK_CHECK_HEIGHT = 9;
// A disabled track's frames are pure black; the margin absorbs YUV to RGB rounding and downscale filtering.
const BLANK_CHANNEL_MAX = 8;
// Every frame in flight when the first mask lands has its own mask by then, so a camera still blank after it is really black.
const BLANK_FRAME_SKIP_WINDOW_MS = SEGMENTATION_TIMEOUT_MS;

export interface PipelineConfig {
    // Mask texels; 0 disables.
    maskClosingRadius: number;
    // Must be >= maskClosingRadius.
    shaderMaxRadius: number;
    segmentationInputMaxEdge: number;
    segmentationResizeQuality: ResizeQuality;
    // 1 segments every frame.
    segmentationFrameInterval: number;
    // 0 leaves the rate uncapped.
    minOutputFrameIntervalMs: number;
    pauseSegmentationWhenHidden: boolean;
    // For consumers whose enqueue closes the frame synchronously.
    notifyAppliedBeforeEnqueue: boolean;
    // CSS color of the spinner shown until the first mask.
    loadingColor: string;
    loadingTimeoutMs: number;
}

export type PipelineBackground =
    | { type: 'blur'; radius: number }
    // `bitmap` must stay open while applied: the compositor re-crops it on resize.
    | { type: 'image'; key: string; bitmap: ImageBitmap };

export interface PipelineHooks {
    onApplied: () => void;
    onInitializationFailed: (error: Error) => void;
    // A returned canvas is segmented in place of the frame.
    prepareSegmentationSource?: (
        frame: VideoFrame,
        size: { width: number; height: number } | null
    ) => OffscreenCanvas | null;
    onFirstFrame?: () => Promise<void>;
    onOutputResize?: (width: number, height: number) => void;
}

// 'done' covers the first mask, a failed or timed-out warmup and teardown.
type Warmup =
    | { state: 'waiting' }
    | {
          state: 'loading';
          startedAtMs: number;
          loop: ReturnType<typeof setInterval>;
          timeout: ReturnType<typeof setTimeout>;
      }
    | { state: 'done' };

interface InputFrameInfo {
    timestampUs: number;
    receivedAtMs: number;
    width: number;
    height: number;
}

const getFrameTimestampUs = (frame: VideoFrame) => frame.timestamp ?? Math.round(Date.now() * 1000);

const backgroundId = (background: PipelineBackground) =>
    background.type === 'blur' ? `blur:${background.radius}` : `image:${background.key}`;

/**
 * Segments and composites camera frames. Free of DOM access so it can run in a worker.
 */
export class BackgroundPipeline {
    private compositor: Compositor | null = null;

    private maskShaper: MaskShaper | null = null;

    private enabled = true;

    private destroyed = false;

    private warmup: Warmup = { state: 'waiting' };

    private hasInitialMask = false;

    private initialMaskAtMs = 0;

    private appliedNotified = false;

    private consecutiveMaskFailures = 0;

    private framesSinceSegmentation = 0;

    private lastOutputFrameTimeMs = 0;

    private lastCanvasWidth = 0;

    private lastCanvasHeight = 0;

    private pageHidden = false;

    private isResizing = false;

    private backgroundSwapsInFlight = 0;

    private background: PipelineBackground | null = null;

    private appliedBackgroundId: string | null = null;

    // Image uploads are async, so overlapping swaps could otherwise land out of order.
    private backgroundChain: Promise<void> = Promise.resolve();

    private pendingJobs: Promise<void>[] = [];

    private lastJob: Promise<void> = Promise.resolve();

    private blackFrameCanvas: OffscreenCanvas | null = null;

    private loadingCanvas: OffscreenCanvas | null = null;

    private loadingContext: OffscreenCanvasRenderingContext2D | null = null;

    private blankCheckContext: OffscreenCanvasRenderingContext2D | null = null;

    // The loading loop writes through the controller of the latest transform call.
    private outputController: TransformStreamDefaultController<VideoFrame> | null = null;

    private lastInputFrame: InputFrameInfo | null = null;

    private lastOutputTimestampUs = -Infinity;

    private debugView: BackgroundDebugView = 'composite';

    constructor(
        private readonly canvas: OffscreenCanvas | HTMLCanvasElement,
        private segmentation: SegmentationClient | null,
        private readonly config: PipelineConfig,
        private readonly hooks: PipelineHooks,
        private readonly logger: PipelineLogger
    ) {}

    init() {
        this.compositor = createCompositor(this.canvas, this.logger);
        if (!this.compositor) {
            throw new Error('WebGL2 is unavailable for the background compositor');
        }
        this.compositor.setDebugView(this.debugView);
    }

    isEnabled() {
        return this.enabled;
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    setPageHidden(hidden: boolean) {
        this.pageHidden = hidden;
    }

    setDebugView(view: BackgroundDebugView) {
        this.debugView = view;
        this.compositor?.setDebugView(view);
    }

    // With null, frames composite against the last mask instead of waiting out request timeouts.
    setSegmentation(segmentation: SegmentationClient | null) {
        this.segmentation?.dispose();
        if (this.destroyed) {
            segmentation?.dispose();
            this.segmentation = null;
            return;
        }
        this.segmentation = segmentation;
    }

    setBackground(background: PipelineBackground): Promise<void> {
        this.background = background;
        const run = this.backgroundChain.then(() => this.applyBackground());
        this.backgroundChain = run.catch(() => {
            // The caller of this swap gets the error
        });
        return run;
    }

    async drain() {
        await Promise.all(this.pendingJobs);
    }

    destroy() {
        if (this.destroyed) {
            return;
        }
        this.destroyed = true;
        this.finishLoading();
        this.outputController = null;
        this.loadingCanvas = null;
        this.loadingContext = null;
        this.blankCheckContext = null;
        this.segmentation?.dispose();
        this.segmentation = null;
        this.maskShaper?.dispose();
        this.maskShaper = null;
        this.compositor?.cleanup();
        this.compositor = null;
        this.blackFrameCanvas = null;
    }

    // Takes ownership of `frame`. Never rejects.
    async transform(frame: VideoFrame, controller: TransformStreamDefaultController<VideoFrame>) {
        if (!(frame instanceof VideoFrame)) {
            return;
        }

        let ownsFrame = true;
        try {
            if (frame.codedWidth === 0 || frame.codedHeight === 0 || this.destroyed) {
                return;
            }

            this.outputController = controller;
            this.lastInputFrame = {
                timestampUs: getFrameTimestampUs(frame),
                receivedAtMs: Date.now(),
                width: frame.displayWidth,
                height: frame.displayHeight,
            };

            if (!this.enabled) {
                await this.drain();
                this.lastOutputTimestampUs = Math.max(this.lastOutputTimestampUs, getFrameTimestampUs(frame));
                controller.enqueue(frame);
                ownsFrame = false;
                return;
            }

            if (this.isResizing || this.backgroundSwapsInFlight > 0 || this.pendingJobs.length >= PIPELINE_DEPTH) {
                return;
            }

            const frameTimeMs = Date.now();
            if (this.shouldDropFrame(frameTimeMs)) {
                return;
            }
            this.lastOutputFrameTimeMs = frameTimeMs;

            if (this.lastCanvasWidth !== frame.displayWidth || this.lastCanvasHeight !== frame.displayHeight) {
                this.isResizing = true;
                try {
                    await this.drain();
                    this.resizeOutput(frame.displayWidth, frame.displayHeight);
                } finally {
                    this.isResizing = false;
                }
                if (this.destroyed) {
                    return;
                }
            }

            if (this.warmup.state === 'waiting') {
                this.startLoading();
                try {
                    await this.hooks.onFirstFrame?.();
                } catch {
                    // Continue without waiting
                }
                ownsFrame = false;
                this.warmUp(frame);
                return;
            }

            ownsFrame = false;
            this.enqueueJob(frame, controller, frameTimeMs);

            if (this.pendingJobs.length >= PIPELINE_DEPTH) {
                await this.pendingJobs[0];
            }
        } catch {
            // Ignore
        } finally {
            if (ownsFrame) {
                frame.close();
            }
        }
    }

    private enqueueJob(
        frame: VideoFrame,
        controller: TransformStreamDefaultController<VideoFrame>,
        frameTimeMs: number
    ) {
        const requestsMask = this.shouldRequestMask();
        let maskRequest: Promise<SegmentationResult | null> | null = null;
        if (requestsMask) {
            this.framesSinceSegmentation = 0;
            maskRequest = this.requestMask(frame);
        } else {
            this.framesSinceSegmentation += 1;
        }

        const previous = this.lastJob;
        const job = (async () => {
            let segmentation: SegmentationResult | null = null;
            let failure: unknown;
            try {
                segmentation = maskRequest ? await maskRequest : null;
            } catch (error) {
                failure = error;
            }
            await previous;
            this.completeJob(frame, controller, frameTimeMs, requestsMask, segmentation, failure);
        })()
            .catch(() => {
                // Ignore
            })
            .finally(() => {
                frame.close();
                this.pendingJobs = this.pendingJobs.filter((pending) => pending !== job);
            });

        this.lastJob = job;
        this.pendingJobs.push(job);
    }

    private completeJob(
        frame: VideoFrame,
        controller: TransformStreamDefaultController<VideoFrame>,
        frameTimeMs: number,
        requestedMask: boolean,
        segmentation: SegmentationResult | null,
        requestFailure: unknown
    ) {
        if (this.destroyed || !this.compositor) {
            return;
        }

        if (requestedMask) {
            let maskApplied = false;
            let maskFailure = requestFailure;
            try {
                maskApplied = segmentation ? this.uploadMask(segmentation) : false;
            } catch (error) {
                maskFailure ??= error;
            }
            this.recordMaskOutcome(maskApplied, maskFailure);
        }

        if (this.backgroundSwapsInFlight > 0) {
            return;
        }

        // The raw track is disabled while the processor attaches, and its black frames would end the spinner.
        if (
            this.warmup.state === 'loading' &&
            this.hasInitialMask &&
            Date.now() - this.initialMaskAtMs < BLANK_FRAME_SKIP_WINDOW_MS &&
            this.isBlankFrame(frame)
        ) {
            return;
        }

        try {
            this.compositor.renderFrame(frame);
            const canRender = this.canvas.width > 0 && this.canvas.height > 0 && this.hasInitialMask;

            if (canRender) {
                this.finishLoading();
                const composited = new VideoFrame(this.canvas, {
                    // Microseconds.
                    timestamp: this.nextOutputTimestamp(frame.timestamp ?? Math.round(frameTimeMs * 1000)),
                });
                if (this.config.notifyAppliedBeforeEnqueue) {
                    this.notifyApplied();
                    this.enqueueOrClose(controller, composited);
                } else {
                    this.enqueueOrClose(controller, composited);
                    this.notifyApplied();
                }
            } else if (this.warmup.state === 'done') {
                // Never expose the raw background before the first mask.
                this.enqueueOrClose(controller, this.createBlackFrame(frame));
            }
        } finally {
            if (this.hasInitialMask) {
                this.notifyApplied();
            }
        }
    }

    private isBlankFrame(frame: VideoFrame) {
        if (!this.blankCheckContext) {
            this.blankCheckContext = new OffscreenCanvas(BLANK_CHECK_WIDTH, BLANK_CHECK_HEIGHT).getContext('2d', {
                willReadFrequently: true,
            });
        }
        const context = this.blankCheckContext;
        if (!context) {
            return false;
        }
        try {
            context.drawImage(frame, 0, 0, BLANK_CHECK_WIDTH, BLANK_CHECK_HEIGHT);
            const { data } = context.getImageData(0, 0, BLANK_CHECK_WIDTH, BLANK_CHECK_HEIGHT);
            for (let index = 0; index < data.length; index += 4) {
                if (
                    data[index] > BLANK_CHANNEL_MAX ||
                    data[index + 1] > BLANK_CHANNEL_MAX ||
                    data[index + 2] > BLANK_CHANNEL_MAX
                ) {
                    return false;
                }
            }
            return true;
        } catch {
            return false;
        }
    }

    private recordMaskOutcome(maskApplied: boolean, maskFailure: unknown) {
        if (maskApplied) {
            if (!this.hasInitialMask) {
                this.initialMaskAtMs = Date.now();
            }
            this.hasInitialMask = true;
            this.consecutiveMaskFailures = 0;
            return;
        }
        if (this.hasInitialMask) {
            return;
        }

        this.consecutiveMaskFailures += 1;
        if (maskFailure && this.consecutiveMaskFailures === 1) {
            this.logger.error('[bg-processor] mask pipeline threw', maskFailure);
        }
        if (this.consecutiveMaskFailures === CONSECUTIVE_MASK_FAILURE_LIMIT) {
            this.finishLoading();
            this.hooks.onInitializationFailed(
                new Error(
                    maskFailure instanceof Error
                        ? `Background segmentation repeatedly failed: ${maskFailure.message}`
                        : 'Background segmentation repeatedly failed'
                )
            );
        }
    }

    private startLoading() {
        this.warmup = {
            state: 'loading',
            startedAtMs: Date.now(),
            loop: setInterval(() => this.emitLoadingFrame(), 1000 / LOADING_FRAMES_PER_SECOND),
            timeout: setTimeout(() => this.finishLoading(), this.config.loadingTimeoutMs),
        };
        this.emitLoadingFrame();
    }

    private finishLoading() {
        if (this.warmup.state === 'loading') {
            clearInterval(this.warmup.loop);
            clearTimeout(this.warmup.timeout);
        }
        this.warmup = { state: 'done' };
    }

    // Runs on a timer so the spinner keeps turning while masks are slow and input frames are dropped.
    private emitLoadingFrame() {
        const controller = this.outputController;
        const input = this.lastInputFrame;
        if (this.warmup.state !== 'loading' || !this.enabled || !controller || !input) {
            return;
        }

        const { width, height } = input;
        if (!this.loadingCanvas || this.loadingCanvas.width !== width || this.loadingCanvas.height !== height) {
            this.loadingCanvas = new OffscreenCanvas(width, height);
            this.loadingContext = this.loadingCanvas.getContext('2d');
        }
        if (!this.loadingContext) {
            return;
        }

        const now = Date.now();
        drawLoadingFrame(this.loadingContext, width, height, now - this.warmup.startedAtMs, this.config.loadingColor);
        try {
            const loadingFrame = new VideoFrame(this.loadingCanvas, {
                timestamp: this.nextOutputTimestamp(input.timestampUs + Math.round((now - input.receivedAtMs) * 1000)),
            });
            this.enqueueOrClose(controller, loadingFrame);
        } catch {
            this.finishLoading();
        }
    }

    private nextOutputTimestamp(candidateUs: number) {
        const timestampUs = Math.max(candidateUs, this.lastOutputTimestampUs + MIN_OUTPUT_TIMESTAMP_STEP_US);
        this.lastOutputTimestampUs = timestampUs;
        return timestampUs;
    }

    private enqueueOrClose(controller: TransformStreamDefaultController<VideoFrame>, output: VideoFrame) {
        try {
            controller.enqueue(output);
        } catch (error) {
            output.close();
            throw error;
        }
    }

    private notifyApplied() {
        if (this.appliedNotified) {
            return;
        }
        this.appliedNotified = true;
        this.hooks.onApplied();
    }

    private uploadMask({ mask, width, height }: SegmentationResult): boolean {
        const compositor = this.compositor;
        if (!compositor) {
            return false;
        }
        this.maskShaper ??= new MaskShaper(compositor.gl, this.config.maskClosingRadius, this.config.shaderMaxRadius);
        if (!this.maskShaper.upload(mask, width, height) || !this.maskShaper.outputTexture) {
            return false;
        }
        compositor.updateMask(this.maskShaper.outputTexture);
        return true;
    }

    // Applied twice to fill both sides of the compositor's double buffer.
    private reapplyLastMask() {
        const texture = this.maskShaper?.outputTexture;
        if (!this.compositor || !texture || !this.hasInitialMask) {
            return;
        }
        this.compositor.updateMask(texture);
        this.compositor.updateMask(texture);
    }

    private async applyBackground() {
        const background = this.background;
        const compositor = this.compositor;
        if (!background || !compositor || this.destroyed) {
            return;
        }
        const id = backgroundId(background);
        if (id === this.appliedBackgroundId) {
            return;
        }

        this.backgroundSwapsInFlight += 1;
        try {
            if (background.type === 'blur') {
                this.appliedBackgroundId = id;
                compositor.setBlurRadius(background.radius);
            } else {
                // Blur takes precedence while a radius is set.
                compositor.setBlurRadius(null);
                this.appliedBackgroundId = id;
                await compositor.setBackgroundImage(background.bitmap);
            }
        } finally {
            this.backgroundSwapsInFlight -= 1;
        }
    }

    private resizeOutput(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.lastCanvasWidth = width;
        this.lastCanvasHeight = height;
        // Resizing the compositor's mask buffers clears them, which would expose the raw frame.
        this.reapplyLastMask();
        this.hooks.onOutputResize?.(width, height);
    }

    private shouldDropFrame(frameTimeMs: number) {
        if (this.config.minOutputFrameIntervalMs === 0 || this.warmup.state === 'waiting') {
            return false;
        }
        return frameTimeMs - this.lastOutputFrameTimeMs < this.config.minOutputFrameIntervalMs;
    }

    private isSegmentationPaused() {
        return this.config.pauseSegmentationWhenHidden && this.pageHidden;
    }

    private shouldRequestMask() {
        if (!this.hasInitialMask) {
            return true;
        }
        if (this.isSegmentationPaused()) {
            return false;
        }
        return this.framesSinceSegmentation >= this.config.segmentationFrameInterval - 1;
    }

    private getResizeOptions(frame: VideoFrame): ImageBitmapOptions | undefined {
        const maxEdge = this.config.segmentationInputMaxEdge;
        const longestEdge = Math.max(frame.displayWidth, frame.displayHeight);
        const scale = longestEdge > maxEdge ? maxEdge / longestEdge : 1;
        if (scale >= 1) {
            return undefined;
        }
        return {
            resizeWidth: Math.max(1, Math.round(frame.displayWidth * scale)),
            resizeHeight: Math.max(1, Math.round(frame.displayHeight * scale)),
            resizeQuality: this.config.segmentationResizeQuality,
        };
    }

    private async requestMask(frame: VideoFrame): Promise<SegmentationResult | null> {
        if (!this.segmentation) {
            return null;
        }
        const resize = this.getResizeOptions(frame);
        let bitmap: ImageBitmap;
        try {
            const source = this.hooks.prepareSegmentationSource?.(
                frame,
                resize?.resizeWidth && resize.resizeHeight
                    ? { width: resize.resizeWidth, height: resize.resizeHeight }
                    : null
            );
            bitmap = source ? await createImageBitmap(source) : await createImageBitmap(frame, resize);
        } catch {
            return null;
        }
        if (this.destroyed || !this.segmentation) {
            bitmap.close();
            return null;
        }
        return this.segmentation.request(bitmap);
    }

    // Takes ownership of `frame`.
    private warmUp(frame: VideoFrame) {
        createImageBitmap(frame, this.getResizeOptions(frame))
            .then((bitmap) => {
                if (this.destroyed || !this.segmentation) {
                    bitmap.close();
                    return;
                }
                this.segmentation.warmUp(bitmap);
            })
            .catch(() => {
                // Ignore
            })
            .finally(() => frame.close());
    }

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
            timestamp: this.nextOutputTimestamp(getFrameTimestampUs(frame)),
        });
    }
}
