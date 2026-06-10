import {
    type AudioCodec,
    AudioSample,
    AudioSampleSource,
    CanvasSource,
    Mp4OutputFormat,
    Output,
    StreamTarget,
    type StreamTargetChunk,
} from 'mediabunny';

import { ENCODER_AUDIO_BITRATE, ENCODER_VIDEO_BITRATE, KEYFRAME_INTERVAL_SEC } from './constants';
import type { AudioTapSamples } from './types';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const AUDIO_STALL_MS = 500; // audio silent this long → fall back to the wall clock
const AUDIO_POLL_MS = 4; // re-check cadence while waiting for the clock to advance

// Encodes the live OffscreenCanvas to a fragmented MP4 at constant frame rate:
// evenly spaced timestamps (n / fps), duplicating the canvas on a missed slot.
// The frame count follows the audio clock (wall-clock fallback when there's no
// audio), so the video duration tracks the audio and can't drift from it.
export class EncoderPipeline {
    private output: Output;
    private videoSource: CanvasSource;
    private audioSource: AudioSampleSource;
    private audioT0: number | null = null;
    private audioTail: Promise<void> = Promise.resolve();
    private audioElapsed = 0;
    private audioUpdatedMs = 0;
    private hasAudio = false;
    private fps: number;
    private running = false;
    private startMs = 0;
    private emittedFrames = 0;
    private loopPromise: Promise<void> | null = null;
    private onError: (error: unknown) => void;

    constructor(
        canvas: OffscreenCanvas,
        fps: number,
        audioCodec: AudioCodec,
        onChunk: (data: Uint8Array<ArrayBuffer>, position: number) => void,
        onError: (error: unknown) => void
    ) {
        this.fps = fps;
        this.onError = onError;

        const writable = new WritableStream<StreamTargetChunk>({
            write(chunk) {
                // Copy out of Mediabunny's buffer before handing ownership off.
                onChunk(chunk.data.slice(), chunk.position);
            },
        });

        this.output = new Output({
            format: new Mp4OutputFormat({ fastStart: 'fragmented' }),
            target: new StreamTarget(writable),
        });

        this.videoSource = new CanvasSource(canvas, {
            codec: 'avc',
            bitrate: ENCODER_VIDEO_BITRATE,
            keyFrameInterval: KEYFRAME_INTERVAL_SEC,
        });
        this.output.addVideoTrack(this.videoSource);

        this.audioSource = new AudioSampleSource({ codec: audioCodec, bitrate: ENCODER_AUDIO_BITRATE });
        this.output.addAudioTrack(this.audioSource);
    }

    public async start(): Promise<void> {
        await this.output.start();
        this.running = true;
        this.startMs = performance.now();
        this.loopPromise = this.captureLoop();
    }

    private async captureLoop(): Promise<void> {
        const frameDuration = 1 / this.fps;
        while (this.running) {
            const nowMs = performance.now();
            const wallElapsed = (nowMs - this.startMs) / 1000;
            const audioLive = this.hasAudio && nowMs - this.audioUpdatedMs < AUDIO_STALL_MS;
            const reference = audioLive ? Math.min(wallElapsed, this.audioElapsed) : wallElapsed;
            const dueFrames = Math.floor(reference * this.fps);
            if (this.emittedFrames <= dueFrames) {
                await this.videoSource.add(this.emittedFrames * frameDuration, frameDuration);
                this.emittedFrames += 1;
            } else {
                const nextSlotMs = this.startMs + (this.emittedFrames * 1000) / this.fps;
                await sleep(Math.max(AUDIO_POLL_MS, nextSlotMs - nowMs));
            }
        }
    }

    public addAudioSamples({ channels, frame, sampleRate }: AudioTapSamples): void {
        if (!this.running || channels.length === 0) {
            return;
        }
        const numberOfChannels = channels.length;
        const numberOfFrames = channels[0].length;
        const timestamp = frame / sampleRate;
        if (this.audioT0 === null) {
            this.audioT0 = timestamp;
        }
        const rebasedTimestamp = timestamp - this.audioT0;

        this.audioElapsed = rebasedTimestamp + numberOfFrames / sampleRate;
        this.audioUpdatedMs = performance.now();
        this.hasAudio = true;

        const data = new Float32Array(numberOfChannels * numberOfFrames);
        for (let c = 0; c < numberOfChannels; c++) {
            data.set(channels[c], c * numberOfFrames);
        }
        const sample = new AudioSample({
            data,
            format: 'f32-planar',
            numberOfChannels,
            sampleRate,
            timestamp: rebasedTimestamp,
        });
        // audioSource.add isn't concurrency-safe — keep these adds serialized.
        this.audioTail = this.audioTail.then(() => this.addAudioSample(sample));
    }

    private async addAudioSample(sample: AudioSample): Promise<void> {
        try {
            await this.audioSource.add(sample);
        } catch (error) {
            if (this.running) {
                this.onError(error);
            }
        }
        sample.close();
    }

    public async stop(): Promise<void> {
        this.running = false;
        await this.loopPromise;
        await this.audioTail;
        await this.output.finalize();
    }
}
