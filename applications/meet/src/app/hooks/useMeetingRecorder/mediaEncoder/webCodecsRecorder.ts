import type { AudioMixer } from '../audioMixer/audioMixer';
import type { RecordingCodec } from '../codec/types';
import type { RecorderAPI } from '../types';
import type { VideoMixerClient } from '../videoMixer/client';
import type { EncoderFailure } from './types';

export const WEBCODECS_MP4_CODEC: RecordingCodec = { mimeType: 'video/mp4', extension: 'mp4' };

interface WebCodecsRecorderOptions {
    videoMixer: VideoMixerClient;
    audioMixer: AudioMixer;
    codec: RecordingCodec;
    onChunk: (data: Uint8Array<ArrayBuffer>) => void;
    onEncoderFailure: (failure: EncoderFailure) => void;
}

// RecorderAPI that drives the WebCodecs/mediabunny pipeline living in the
// videoMixer worker: video frames come from its CanvasSource, audio is tapped
// from the audioMixer via an AudioWorklet.
export class WebCodecsRecorder implements RecorderAPI {
    private videoMixer: VideoMixerClient;
    private audioMixer: AudioMixer;
    private codec: RecordingCodec;
    private onChunk: (data: Uint8Array<ArrayBuffer>) => void;
    private onEncoderFailure: (failure: EncoderFailure) => void;
    private recording = false;

    constructor({ videoMixer, audioMixer, codec, onChunk, onEncoderFailure }: WebCodecsRecorderOptions) {
        this.videoMixer = videoMixer;
        this.audioMixer = audioMixer;
        this.codec = codec;
        this.onChunk = onChunk;
        this.onEncoderFailure = onEncoderFailure;
    }

    public async start(): Promise<void> {
        this.videoMixer.startEncoder(this.onChunk, this.onEncoderFailure);
        await this.audioMixer.startWorkletTap((samples) => this.videoMixer.provideAudioSamples(samples));
        this.recording = true;
    }

    public async stop(): Promise<void> {
        this.audioMixer.stopWorkletTap();
        await this.videoMixer.stopEncoder();
        this.recording = false;
    }

    public getActiveCodec(): RecordingCodec {
        return this.codec;
    }

    public getRecorderState(): RecordingState {
        return this.recording ? 'recording' : 'inactive';
    }
}
