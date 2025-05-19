import type { Track, TrackProcessor, VideoProcessorOptions } from 'livekit-client';

const frameRate = 30;
const detectionIntervalInMilliseconds = 50;
const drawIntervalInMilliseconds = 1000 / frameRate;
const padding = 0.65;
const smoothingFactor = 0.9;
const detectionWidth = 160;
const detectionHeight = 120;

const handleSmoothing = (current: number, previous: number) =>
    previous * smoothingFactor + current * (1 - smoothingFactor);

export class FaceTrackingProcessor implements TrackProcessor<Track.Kind.Video, VideoProcessorOptions> {
    name = 'face-tracking-processor';

    processedTrack?: MediaStreamTrack;

    private video: HTMLVideoElement;

    private canvas: HTMLCanvasElement;

    private ctx: CanvasRenderingContext2D;

    private lastFace: { x: number; y: number; width: number; height: number } | null = null;

    private detectionTimer: number | null = null;

    private drawTimer: number | null = null;

    private worker: Worker | null = null;

    private workerReady: boolean = false;

    private detectionCanvas: HTMLCanvasElement;

    private detectionCtx: CanvasRenderingContext2D;

    constructor({
        width = 640,
        height = 480,
    }: {
        width?: number;
        height?: number;
    } = {}) {
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.video.muted = true;
        this.video.playsInline = true;

        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
            throw new Error('Could not get 2D context');
        }
        this.ctx = ctx;

        this.detectionCanvas = document.createElement('canvas');
        this.detectionCanvas.width = detectionWidth;
        this.detectionCanvas.height = detectionHeight;
        const detectionCtx = this.detectionCanvas.getContext('2d');
        if (!detectionCtx) {
            throw new Error('Could not get detection 2D context');
        }
        this.detectionCtx = detectionCtx;
    }

    async init(opts: VideoProcessorOptions) {
        try {
            if (opts.track.readyState !== 'live') {
                throw new Error('Input video track is not live');
            }

            const stream = new MediaStream([opts.track]);
            this.video.srcObject = stream;

            await this.video.play();

            // Worker setup
            this.worker = new Worker(new URL('../../faceDetectionWorker.worker.ts', import.meta.url), {
                type: 'module',
            });
            this.worker.onmessage = (event: MessageEvent) => {
                if (event.data.type === 'ready') {
                    this.workerReady = true;
                } else if (event.data.type === 'result') {
                    const predictions = event.data.predictions;
                    if (predictions.length > 0) {
                        const face = predictions[0];
                        const topLeft = face.topLeft as number[];
                        const bottomRight = face.bottomRight as number[];

                        // Scale up to original video size
                        const scaleX = this.video.videoWidth / detectionWidth;
                        const scaleY = this.video.videoHeight / detectionHeight;

                        const faceWidth = (bottomRight[0] - topLeft[0]) * scaleX;
                        const faceHeight = (bottomRight[1] - topLeft[1]) * scaleY;

                        let cropStartX = Math.max(0, topLeft[0] * scaleX - faceWidth * padding);
                        let cropStartY = Math.max(0, topLeft[1] * scaleY - faceHeight * padding);
                        let cropWidth = Math.min(this.video.videoWidth - cropStartX, faceWidth * (1 + padding * 2));
                        let cropHeight = Math.min(this.video.videoHeight - cropStartY, faceHeight * (1 + padding * 2));

                        if (this.lastFace) {
                            cropStartX = handleSmoothing(cropStartX, this.lastFace.x);
                            cropStartY = handleSmoothing(cropStartY, this.lastFace.y);
                            cropWidth = handleSmoothing(cropWidth, this.lastFace.width);
                            cropHeight = handleSmoothing(cropHeight, this.lastFace.height);
                        }
                        this.lastFace = { x: cropStartX, y: cropStartY, width: cropWidth, height: cropHeight };
                    } else {
                        this.lastFace = null;
                    }
                }
            };
            this.worker.postMessage({ type: 'init' });

            this.processedTrack = this.canvas.captureStream(frameRate).getVideoTracks()[0];

            this.start();
        } catch (err) {
            console.error('FaceTrackingProcessor init failed:', err);
            throw err;
        }
    }

    private start() {
        // Face detection loop (throttled, uses worker)
        this.detectionTimer = window.setInterval(() => {
            if (!this.worker || !this.workerReady || this.video.readyState < 2) {
                return;
            }
            // Draw the video frame to the downscale canvas
            this.detectionCtx.drawImage(
                this.video,
                0,
                0,
                this.video.videoWidth,
                this.video.videoHeight,
                0,
                0,
                detectionWidth,
                detectionHeight
            );
            void createImageBitmap(this.detectionCanvas).then((imageBitmap) => {
                this.worker!.postMessage({ type: 'frame', imageBitmap }, [imageBitmap]);
            });
        }, detectionIntervalInMilliseconds);

        // Using setInterval as requestAnimationFrame is stopped in background tabs
        this.drawTimer = window.setInterval(() => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.save();
            this.ctx.translate(this.canvas.width, 0);
            this.ctx.scale(-1, 1);

            if (this.lastFace) {
                this.ctx.drawImage(
                    this.video,
                    this.lastFace.x,
                    this.lastFace.y,
                    this.lastFace.width,
                    this.lastFace.height,
                    0,
                    0,
                    this.canvas.width,
                    this.canvas.height
                );
            } else {
                this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            }

            this.ctx.restore();
        }, drawIntervalInMilliseconds);
    }

    async restart(opts: VideoProcessorOptions) {
        await this.destroy();
        await this.init(opts);
    }

    async destroy() {
        if (this.detectionTimer !== null) {
            clearInterval(this.detectionTimer);
            this.detectionTimer = null;
        }
        if (this.drawTimer !== null) {
            clearInterval(this.drawTimer);
            this.drawTimer = null;
        }
        if (this.processedTrack) {
            this.processedTrack.stop();
            this.processedTrack = undefined;
        }
        if (this.video.srcObject) {
            (this.video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
            this.video.srcObject = null;
        }
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.lastFace = null;
        this.workerReady = false;
    }
}
