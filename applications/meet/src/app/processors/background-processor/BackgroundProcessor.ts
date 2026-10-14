import {
    type BackgroundOptions,
    ProcessorWrapper,
    type VideoTrackTransformer,
    type VideoTransformerInitOptions,
} from '@livekit/track-processors';
import type { ProcessorOptions, Track, TrackProcessor } from 'livekit-client';

import { logger } from '@proton/logger';
import { withTimeout } from '@proton/meet/utils/withTimeout';
import { isFirefox, isIos } from '@proton/shared/lib/helpers/browser';

import {
    BACKGROUND_IMAGE_DECODE_TIMEOUT_MS,
    MAX_BACKGROUND_IMAGE_EDGE,
    MAX_BACKGROUND_IMAGE_PIXELS,
} from '../../utils/customBackgrounds/constants';
import { BackgroundPipeline, type PipelineBackground, type PipelineConfig } from './BackgroundPipeline';
import {
    MASK_CLOSING_MAX_RADIUS,
    MASK_TEMPORAL_APPEAR_RATE,
    MASK_TEMPORAL_APPEAR_RATE_FAST,
    MASK_TEMPORAL_DISAPPEAR_RATE,
    MASK_TEMPORAL_DISAPPEAR_RATE_FAST,
    MASK_TEMPORAL_REFERENCE_FPS,
    MAX_FPS_MOBILE,
    MULTICLASS_PERSON_CONFIDENCE_BOOST,
    PERSON_CONFIDENCE_BOOST,
    SEGMENTATION_FRAME_INTERVAL,
} from './constants';
import { createProcessorWrapper } from './createProcessorWrapper';
import { SegmentationClient } from './segmentationClient';
import { type SegmenterHandle, startSegmenter } from './segmenterHost';
import {
    DEFAULT_BLUR_RADIUS,
    type TunableConstantsOverrides,
    getDefaultMaskClosingRadius,
    getDefaultSegmentationInputMaxEdge,
    getSegmentationResizeQuality,
    pickWorkerOverrides,
} from './tunableConstants';
import type { BackgroundMode, BackgroundProcessor, BackgroundProcessorOptions } from './types';
import { WorkerSession } from './workerSession';

export { preloadBackgroundBlurAssets } from './segmenterHost';

const MAX_CACHED_BACKGROUND_BITMAPS = 4;

const INITIAL_MASK_TIMEOUT_MS = 20000;

const FIRST_FRAME_CALLBACK_TIMEOUT_MS = 5000;

type AppliedWaiter = { resolve: () => void; reject: (error: Error) => void };

// 'main-fallback' is LiveKit's canvas loop, paced by the wrapper's maxFps.
type PipelineHosting = 'worker' | 'main-stream' | 'main-fallback';

// Keeps the EMA time constant fixed when applying the rate once per `periods` reference periods.
const resampleTemporalRate = (rate: number, periods: number): number => {
    if (periods <= 1 || rate <= 0 || rate >= 1) {
        return rate;
    }
    return 1 - (1 - rate) ** periods;
};

const resolveInt = (override: number | undefined, fallback: number, min: number): number =>
    typeof override === 'number' && Number.isFinite(override) ? Math.max(min, Math.round(override)) : fallback;

const backgroundKey = (mode: BackgroundMode): string | null =>
    mode.type === 'image' ? `image:${mode.imageUrl}` : null;

interface PipelineHost {
    getPipelineConfig: (hosting: PipelineHosting) => PipelineConfig;
    resolveBackground: () => Promise<PipelineBackground>;
    startSegmenter: () => Promise<SegmenterHandle>;
    isEnabled: () => boolean;
    onApplied: () => void;
    onInitializationFailed: (error: Error) => void;
    update: (options: Partial<BackgroundProcessorOptions>) => Promise<void>;
}

interface EffectSession {
    readonly segmenter: SegmenterHandle | null;
    // Takes ownership of `segmenter`.
    replaceSegmenter: (segmenter: SegmenterHandle | null) => void;
    setBackground: (background: PipelineBackground) => Promise<void>;
    setEnabled: (enabled: boolean) => void;
    destroy: () => Promise<void>;
}

const SEGMENTER_RESTART_LIMIT = 1;

// Fallback where the pipeline can't run in a worker: Firefox, iOS, and Safari before 18.
class MainThreadTransformer implements VideoTrackTransformer<BackgroundOptions> {
    transformer?: TransformStream;

    private pipeline: BackgroundPipeline | null = null;

    private segmenter: SegmenterHandle | null = null;

    private inputVideo: HTMLVideoElement | null = null;

    // Keyed on the OS, not the engine: WebKit elsewhere is unaffected.
    private readonly needsIosOrientationWorkaround = isIos();

    // Reused surface for redrawing rotated camera frames upright.
    private orientationCanvas: OffscreenCanvas | null = null;
    private orientationContext: OffscreenCanvasRenderingContext2D | null = null;
    private settingsSize: { width: number; height: number } | null = null;

    private orientedFrames = new WeakSet<VideoFrame>();

    // Segmentation-sized surface, only used while reorienting.
    private segmentationCanvas: OffscreenCanvas | null = null;
    private segmentationContext: OffscreenCanvasRenderingContext2D | null = null;

    private outputSizeListener: ((width: number, height: number) => void) | null = null;

    constructor(private readonly host: PipelineHost) {}

    get activePipeline() {
        return this.pipeline;
    }

    get activeSegmenter() {
        return this.segmenter;
    }

    replaceSegmenter(segmenter: SegmenterHandle | null) {
        if (!this.pipeline) {
            segmenter?.terminate();
            return;
        }
        const previous = this.segmenter;
        this.segmenter = segmenter;
        this.pipeline.setSegmentation(segmenter ? new SegmentationClient(segmenter.connect()) : null);
        if (previous !== segmenter) {
            previous?.terminate();
        }
    }

    setOutputSizeListener(listener: ((width: number, height: number) => void) | null) {
        this.outputSizeListener = listener;
    }

    async init({ outputCanvas, inputElement }: VideoTransformerInitOptions) {
        this.inputVideo = inputElement;
        this.transformer = new TransformStream({
            transform: (frame, controller) => this.transform(frame, controller),
            flush: () => this.pipeline?.drain(),
        });

        // Captured before the first frame resizes the canvas.
        if (this.needsIosOrientationWorkaround && outputCanvas.width && outputCanvas.height) {
            this.settingsSize = { width: outputCanvas.width, height: outputCanvas.height };
        }

        const segmenter = await this.host.startSegmenter();
        const pipeline = new BackgroundPipeline(
            outputCanvas,
            new SegmentationClient(segmenter.connect()),
            this.host.getPipelineConfig(ProcessorWrapper.hasModernApiSupport ? 'main-stream' : 'main-fallback'),
            {
                onApplied: this.host.onApplied,
                onInitializationFailed: this.host.onInitializationFailed,
                prepareSegmentationSource: (frame, size) => this.drawSegmentationSource(frame, size),
                onFirstFrame: () => this.waitForFirstPresentedFrame(),
                onOutputResize: (width, height) => this.outputSizeListener?.(width, height),
            },
            logger
        );

        try {
            pipeline.init();
            pipeline.setEnabled(this.host.isEnabled());
            await pipeline.setBackground(await this.host.resolveBackground());
        } catch (error) {
            pipeline.destroy();
            segmenter.terminate();
            throw error;
        }

        this.segmenter = segmenter;
        this.pipeline = pipeline;
    }

    async restart(options: VideoTransformerInitOptions) {
        await this.destroy();
        await this.init(options);
    }

    async destroy() {
        this.pipeline?.destroy();
        this.pipeline = null;
        this.segmenter?.terminate();
        this.segmenter = null;
        this.orientationCanvas = null;
        this.orientationContext = null;
        this.settingsSize = null;
        this.segmentationCanvas = null;
        this.segmentationContext = null;
    }

    async update(options: BackgroundOptions) {
        await this.host.update(options as Partial<BackgroundProcessorOptions>);
    }

    async transform(frame: VideoFrame, controller: TransformStreamDefaultController<VideoFrame>) {
        const pipeline = this.pipeline;
        if (!pipeline || !(frame instanceof VideoFrame) || frame.codedWidth === 0 || frame.codedHeight === 0) {
            if (frame instanceof VideoFrame) {
                frame.close();
            }
            return;
        }

        pipeline.setPageHidden(document.visibilityState === 'hidden');

        // The fallback path republishes disabled frames through its canvas, so they need it too.
        const shouldReorient = pipeline.isEnabled() || !ProcessorWrapper.hasModernApiSupport;
        const orientedFrame = shouldReorient ? this.createDisplayOrientedFrame(frame) : null;
        if (orientedFrame) {
            frame.close();
            return pipeline.transform(orientedFrame, controller);
        }
        return pipeline.transform(frame, controller);
    }

    private getPresentedSize(): { width: number; height: number } | null {
        const video = this.inputVideo;
        if (video && video.videoWidth > 0 && video.videoHeight > 0) {
            return { width: video.videoWidth, height: video.videoHeight };
        }
        return this.settingsSize;
    }

    // iOS frames lack the rotation the <video> element presents with; drawing the element
    // applies it.
    private createDisplayOrientedFrame(frame: VideoFrame): VideoFrame | null {
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
            this.orientedFrames.add(orientedFrame);
            return orientedFrame;
        } catch {
            return null;
        }
    }

    private drawSegmentationSource(
        frame: VideoFrame,
        size: { width: number; height: number } | null
    ): OffscreenCanvas | null {
        const video = this.inputVideo;
        if (!this.orientedFrames.has(frame) || !video || !size) {
            return null;
        }

        const { width, height } = size;
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

    private async waitForFirstPresentedFrame() {
        const video = this.inputVideo;
        if (!video) {
            return;
        }
        const presented = new Promise<void>((resolve) => {
            video.requestVideoFrameCallback((_now, metadata) => {
                setTimeout(resolve, metadata.expectedDisplayTime - metadata.presentationTime);
            });
        });
        await withTimeout(presented, 'Video frame callback timeout on first frame', FIRST_FRAME_CALLBACK_TIMEOUT_MS);
    }
}

class BackgroundEffectProcessor implements TrackProcessor<Track.Kind.Video> {
    readonly name: string;

    processedTrack?: MediaStreamTrack;

    private options: BackgroundProcessorOptions;

    private mode: BackgroundMode;

    private activeDelegate: 'GPU' | 'CPU' | undefined;

    private session: EffectSession | null = null;

    private readonly mainThreadTransformer: MainThreadTransformer;

    private readonly mainThreadWrapper: ProcessorWrapper<BackgroundOptions>;

    private readonly mainThreadSession: EffectSession;

    private enabled = true;

    private hasInitialMask = false;

    private initializationError: Error | null = null;

    private appliedWaiters: AppliedWaiter[] = [];

    private lifecycleGeneration = 0;

    private initializingBackground: PipelineBackground | null = null;

    private reusableSegmenter: SegmenterHandle | null = null;

    private segmenterRestartsLeft = SEGMENTER_RESTART_LIMIT;

    // Most recently used last.
    private backgroundBitmaps = new Map<string, ImageBitmap>();

    // Currently on the compositor, so the cache never evicts it.
    private appliedBackgroundKey: string | null = null;

    private sessionModeId: string | null = null;

    // Bumped per applyMode() call so a superseded swap can bail out.
    private modeGeneration = 0;

    // Morphological-close radius in mask texels, sized by device tier; 0 disables.
    private readonly maskClosingRadius: number;
    // Longest edge (px) the frame is downscaled to before segmentation.
    private readonly segmentationInputMaxEdge: number;
    // Composited frames per segmentation request; 1 segments every frame.
    private readonly segmentationFrameInterval: number;

    constructor(options: BackgroundProcessorOptions) {
        this.options = options;
        this.mode = options.mode ?? { type: 'blur' };

        const overrides = options.constantOverrides;
        this.maskClosingRadius = resolveInt(overrides?.maskClosingRadius, getDefaultMaskClosingRadius(options), 0);
        this.segmentationInputMaxEdge = resolveInt(
            overrides?.segmentationInputMaxEdge,
            getDefaultSegmentationInputMaxEdge(options),
            1
        );
        this.segmentationFrameInterval = resolveInt(
            overrides?.segmentationFrameInterval,
            SEGMENTATION_FRAME_INTERVAL,
            1
        );

        const host: PipelineHost = {
            getPipelineConfig: (hosting) => this.getPipelineConfig(hosting),
            resolveBackground: () =>
                this.initializingBackground
                    ? Promise.resolve(this.initializingBackground)
                    : this.resolveBackground(this.mode),
            startSegmenter: () => this.startSegmenter(),
            isEnabled: () => this.enabled,
            onApplied: () => this.markApplied(),
            onInitializationFailed: (error) => this.rejectApplied(error),
            update: (update) => this.update(update),
        };
        this.mainThreadTransformer = new MainThreadTransformer(host);
        this.mainThreadWrapper = createProcessorWrapper<BackgroundOptions>(
            this.mainThreadTransformer,
            'background-effect',
            options
        );
        this.name = this.mainThreadWrapper.name;
        const transformer = this.mainThreadTransformer;
        this.mainThreadSession = {
            get segmenter() {
                return transformer.activeSegmenter;
            },
            replaceSegmenter: (segmenter) => transformer.replaceSegmenter(segmenter),
            setBackground: async (background) => {
                await transformer.activePipeline?.setBackground(background);
            },
            setEnabled: (enabled) => transformer.activePipeline?.setEnabled(enabled),
            destroy: () => this.mainThreadWrapper.destroy(),
        };
    }

    async init(options: ProcessorOptions<Track.Kind.Video>) {
        // `enabled` survives camera switches.
        this.hasInitialMask = false;
        this.initializationError = null;
        this.sessionModeId = null;
        this.segmenterRestartsLeft = SEGMENTER_RESTART_LIMIT;
        const generation = this.lifecycleGeneration;
        const isSuperseded = () => generation !== this.lifecycleGeneration;

        const mode = this.mode;
        const background = await this.resolveBackground(mode);

        const { session: workerSession, unusedSegmenter } = await WorkerSession.create({
            track: options.track,
            localTrack: options.localTrack,
            config: this.getPipelineConfig('worker'),
            background,
            enabled: this.enabled,
            startSegmenter: () => this.startSegmenter(),
            onApplied: () => this.markApplied(),
            onInitializationFailed: (error) => this.rejectApplied(error),
        });

        if (isSuperseded()) {
            unusedSegmenter?.terminate();
            await workerSession?.destroy();
            throw new Error('The background effect was destroyed while initializing');
        }

        if (workerSession) {
            this.session = workerSession;
            this.processedTrack = workerSession.processedTrack ?? undefined;
        } else {
            this.reusableSegmenter = unusedSegmenter;
            this.initializingBackground = background;
            try {
                await this.mainThreadWrapper.init(options);
            } finally {
                this.initializingBackground = null;
                this.reusableSegmenter?.terminate();
                this.reusableSegmenter = null;
            }
            if (isSuperseded()) {
                await this.mainThreadWrapper.destroy();
                throw new Error('The background effect was destroyed while initializing');
            }
            this.session = this.mainThreadSession;
            this.processedTrack = this.mainThreadWrapper.processedTrack;
        }
        this.appliedBackgroundKey = background.type === 'image' ? background.key : null;
        this.sessionModeId = this.getModeId(mode);

        // setMode() resolved for this mode while no session existed, so a failure here is the
        // attach's to report; LiveKit doesn't destroy a processor whose init() rejects.
        const latestMode = this.mode;
        if (latestMode !== mode) {
            try {
                await this.applyMode(latestMode);
            } catch (error) {
                if (this.mode === latestMode) {
                    this.mode = mode;
                }
                if (!isSuperseded()) {
                    await this.destroy();
                    this.rejectApplied(
                        error instanceof Error ? error : new Error('The background could not be applied')
                    );
                }
                throw error;
            }
        }
    }

    async restart(options: ProcessorOptions<Track.Kind.Video>) {
        await this.destroy();
        await this.init(options);
    }

    async destroy() {
        this.lifecycleGeneration += 1;
        this.modeGeneration += 1;
        const session = this.session;
        this.session = null;
        this.processedTrack = undefined;
        await session?.destroy();
        this.reusableSegmenter?.terminate();
        this.reusableSegmenter = null;

        // Unblock any pending UI waiters (teardown isn't a failure, so resolve).
        this.resolveApplied();
        this.initializationError = null;
        this.hasInitialMask = false;
        this.sessionModeId = null;
        this.appliedBackgroundKey = null;
        this.backgroundBitmaps.forEach((bitmap) => bitmap.close());
        this.backgroundBitmaps.clear();
    }

    enable() {
        this.setEnabled(true);
    }

    disable() {
        this.setEnabled(false);
    }

    isEnabled() {
        return this.enabled;
    }

    getActiveDelegate() {
        return this.activeDelegate;
    }

    hasAppliedMask() {
        return this.hasInitialMask;
    }

    async setMode(mode: BackgroundMode) {
        const previousMode = this.mode;
        this.mode = mode;
        try {
            await this.applyMode(mode);
        } catch (error) {
            if (this.mode === mode) {
                this.mode = previousMode;
            }
            throw error;
        }
    }

    async update(update: Partial<BackgroundProcessorOptions>) {
        this.options = { ...this.options, ...update };
        if (update.mode) {
            this.mode = update.mode;
        }
        await this.applyMode(this.mode);
    }

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

    private setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.session?.setEnabled(enabled);
    }

    private markApplied() {
        this.hasInitialMask = true;
        this.resolveApplied();
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

    private async startSegmenter(): Promise<SegmenterHandle> {
        const reusable = this.reusableSegmenter;
        if (reusable) {
            this.reusableSegmenter = null;
            return reusable;
        }

        const configuredDelegate = this.options.segmenterOptions?.delegate;
        const delegate: 'GPU' | 'CPU' =
            configuredDelegate === 'GPU' || configuredDelegate === 'CPU' ? configuredDelegate : 'GPU';
        let started: SegmenterHandle | null = null;
        try {
            started = await startSegmenter({
                assetPaths: this.options.assetPaths,
                delegate,
                constantOverrides: this.getWorkerConstantOverrides(),
                onCrash: (error) => this.handleSegmenterCrash(started, error),
            });
            this.activeDelegate = started.delegate;
            return started;
        } catch (error) {
            this.rejectApplied(error instanceof Error ? error : new Error('Background processor worker init failed'));
            throw error;
        }
    }

    private handleSegmenterCrash(crashed: SegmenterHandle | null, error: Error) {
        this.rejectApplied(error);

        const session = this.session;
        if (!crashed || !session || session.segmenter !== crashed) {
            return;
        }
        session.replaceSegmenter(null);

        if (this.segmenterRestartsLeft <= 0) {
            return;
        }
        this.segmenterRestartsLeft -= 1;
        void this.startSegmenter()
            .then((replacement) => {
                if (this.session === session) {
                    session.replaceSegmenter(replacement);
                } else {
                    replacement.terminate();
                }
            })
            .catch(() => {
                // Ignore
            });
    }

    private getPipelineConfig(hosting: PipelineHosting): PipelineConfig {
        const isMobile = !!this.options.isMobile;
        const isMainThread = hosting !== 'worker';
        return {
            maskClosingRadius: this.maskClosingRadius,
            shaderMaxRadius: Math.max(MASK_CLOSING_MAX_RADIUS, this.maskClosingRadius),
            segmentationInputMaxEdge: this.segmentationInputMaxEdge,
            segmentationResizeQuality: getSegmentationResizeQuality(this.options),
            segmentationFrameInterval: this.segmentationFrameInterval,
            // The fallback loop is already paced by maxFps.
            minOutputFrameIntervalMs: isMobile && hosting !== 'main-fallback' ? 1000 / MAX_FPS_MOBILE : 0,
            // Mobile stops asking for masks while the page is hidden. Compositing carries on
            // against the last mask: disabling the processor would enqueue the raw frame and
            // publish the unprocessed background to everyone still watching.
            pauseSegmentationWhenHidden: isMobile,
            notifyAppliedBeforeEnqueue: isMainThread && isFirefox(),
        };
    }

    // The EMA rates were tuned at a higher mask update rate than mobile achieves.
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

    private getWorkerConstantOverrides(): TunableConstantsOverrides {
        return {
            personConfidenceBoost: this.options.personConfidenceBoost ?? PERSON_CONFIDENCE_BOOST,
            multiclassPersonConfidenceBoost:
                this.options.multiclassPersonConfidenceBoost ?? MULTICLASS_PERSON_CONFIDENCE_BOOST,
            ...this.getTemporalRateOverrides(),
            ...pickWorkerOverrides(this.options.constantOverrides ?? {}),
        };
    }

    // The debug tuner's radius wins over the mode's, and 0 is valid there.
    private getBlurRadius(mode: { blurRadius?: number }): number {
        const override = this.options.constantOverrides?.blurRadius;
        if (typeof override === 'number' && Number.isFinite(override)) {
            return Math.max(0, Math.round(override));
        }
        return typeof mode.blurRadius === 'number' ? mode.blurRadius : DEFAULT_BLUR_RADIUS;
    }

    private getModeId(mode: BackgroundMode): string {
        return mode.type === 'blur' ? `blur:${this.getBlurRadius(mode)}` : backgroundKey(mode)!;
    }

    private async resolveBackground(mode: BackgroundMode): Promise<PipelineBackground> {
        if (mode.type === 'blur') {
            return { type: 'blur', radius: this.getBlurRadius(mode) };
        }
        const bitmap = await this.prepareBackgroundBitmap(mode);
        return { type: 'image', key: backgroundKey(mode)!, bitmap };
    }

    private async applyMode(mode: BackgroundMode) {
        const session = this.session;
        if (!session) {
            return;
        }
        const modeId = this.getModeId(mode);
        if (modeId === this.sessionModeId) {
            return;
        }

        const generation = ++this.modeGeneration;
        const background = await this.resolveBackground(mode);

        // A newer swap took over, or the pipeline was torn down while decoding.
        if (generation !== this.modeGeneration || session !== this.session) {
            return;
        }

        this.appliedBackgroundKey = background.type === 'image' ? background.key : null;
        this.sessionModeId = modeId;
        try {
            await session.setBackground(background);
        } catch (error) {
            this.sessionModeId = null;
            throw error;
        }
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

    private async prepareBackgroundBitmap(mode: Extract<BackgroundMode, { type: 'image' }>): Promise<ImageBitmap> {
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

    // The applied bitmap is kept: the main-thread compositor re-crops from it on resize.
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
}

export const createBackgroundProcessorHandle = (options: BackgroundProcessorOptions): BackgroundProcessor =>
    new BackgroundEffectProcessor(options);
