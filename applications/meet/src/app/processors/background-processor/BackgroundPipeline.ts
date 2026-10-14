import { type Compositor, createCompositor } from './compositor';
import { MaskShaper } from './maskShaper';
import type { SegmentationClient, SegmentationResult } from './segmentationClient';
import type { PipelineLogger } from './types';

// Two frames in flight keep the next mask request queued while the current frame composites.
const PIPELINE_DEPTH = 2;

const CONSECUTIVE_MASK_FAILURE_LIMIT = 500;

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

    private isFirstFrame = true;

    private hasInitialMask = false;

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

            if (!this.enabled) {
                await this.drain();
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

            if (this.isFirstFrame) {
                this.isFirstFrame = false;
                this.enqueueOrClose(controller, this.createBlackFrame(frame));
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

        try {
            this.compositor.renderFrame(frame);
            const canRender = this.canvas.width > 0 && this.canvas.height > 0 && this.hasInitialMask;

            if (canRender) {
                const composited = new VideoFrame(this.canvas, {
                    // Microseconds.
                    timestamp: frame.timestamp ?? Math.round(frameTimeMs * 1000),
                });
                if (this.config.notifyAppliedBeforeEnqueue) {
                    this.notifyApplied();
                    this.enqueueOrClose(controller, composited);
                } else {
                    this.enqueueOrClose(controller, composited);
                    this.notifyApplied();
                }
            } else {
                // Never expose the raw background before the first mask.
                this.enqueueOrClose(controller, this.createBlackFrame(frame));
            }
        } finally {
            if (this.hasInitialMask) {
                this.notifyApplied();
            }
        }
    }

    private recordMaskOutcome(maskApplied: boolean, maskFailure: unknown) {
        if (maskApplied) {
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
            this.hooks.onInitializationFailed(
                new Error(
                    maskFailure instanceof Error
                        ? `Background segmentation repeatedly failed: ${maskFailure.message}`
                        : 'Background segmentation repeatedly failed'
                )
            );
        }
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
        if (this.config.minOutputFrameIntervalMs === 0 || this.isFirstFrame) {
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
            timestamp: frame.timestamp ?? Math.round(Date.now() * 1000),
        });
    }
}
