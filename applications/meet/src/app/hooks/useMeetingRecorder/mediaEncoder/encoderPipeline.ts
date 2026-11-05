import {
    AppendOnlyStreamTarget,
    type AudioCodec,
    AudioSample,
    AudioSampleSource,
    CanvasSource,
    Mp4OutputFormat,
    Output,
} from 'mediabunny';

import { AUDIO_STALL_MS, ENCODER_AUDIO_BITRATE, ENCODER_VIDEO_BITRATE, KEYFRAME_INTERVAL_SEC } from './constants';
import type { AudioTapSamples, EncoderTrack } from './types';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const AUDIO_POLL_MS = 4; // re-check cadence while waiting for the clock to advance
const MAX_CATCH_UP_SLOTS = 1;
const DURATION_FROM_NEXT_FRAME = 0;

// Encodes the live OffscreenCanvas to a fragmented MP4 with timestamps on a
// 1 / fps grid. Each frame takes the clock's slot at capture time (audio clock,
// wall-clock fallback when there's no audio), so an encoder that can't keep up
// skips slots instead of squeezing the video shorter than the audio. The muxer
// derives each frame's duration from the next frame so a skipped slot extends
// the previous one: QuickTime times frames by duration, not fragment start.
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
    private hasFailed = false;
    private startMs = 0;
    private nextSlot = 0;
    private loopPromise: Promise<void> | null = null;
    private onError: (track: EncoderTrack, error: unknown) => void;

    constructor(
        canvas: OffscreenCanvas,
        fps: number,
        audioCodec: AudioCodec,
        onChunk: (data: Uint8Array<ArrayBuffer>) => void,
        onError: (track: EncoderTrack, error: unknown) => void
    ) {
        this.fps = fps;
        this.onError = onError;

        const writable = new WritableStream<Uint8Array<ArrayBuffer>>({
            write(chunk) {
                onChunk(chunk.slice());
            },
        });

        this.output = new Output({
            format: new Mp4OutputFormat({ fastStart: 'fragmented' }),
            target: new AppendOnlyStreamTarget(writable),
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
        try {
            while (this.running) {
                const nowMs = performance.now();
                const wallElapsed = (nowMs - this.startMs) / 1000;
                const audioLive = this.hasAudio && nowMs - this.audioUpdatedMs < AUDIO_STALL_MS;
                const reference = audioLive ? Math.min(wallElapsed, this.audioElapsed) : wallElapsed;
                const dueSlot = Math.floor(reference * this.fps);
                if (this.nextSlot <= dueSlot) {
                    const slot = dueSlot - this.nextSlot > MAX_CATCH_UP_SLOTS ? dueSlot : this.nextSlot;
                    await this.videoSource.add(slot * frameDuration, DURATION_FROM_NEXT_FRAME);
                    this.nextSlot = slot + 1;
                } else {
                    const nextSlotMs = this.startMs + (this.nextSlot * 1000) / this.fps;
                    await sleep(Math.max(AUDIO_POLL_MS, nextSlotMs - nowMs));
                }
            }
        } catch (error) {
            this.fail('video', error);
        }
    }

    private fail(track: EncoderTrack, error: unknown): void {
        if (!this.running) {
            return;
        }
        this.running = false;
        this.hasFailed = true;
        this.onError(track, error);
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
            this.fail('audio', error);
        }
        sample.close();
    }

    public async stop(): Promise<void> {
        this.running = false;
        await this.loopPromise;
        await this.audioTail;
        if (this.hasFailed) {
            return;
        }
        await this.output.finalize();
    }
}
