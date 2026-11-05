export type AudioTapSamples = {
    channels: Float32Array[];
    frame: number;
    sampleRate: number;
};

export type EncoderTrack = 'video' | 'audio';

export type EncoderFailure = {
    track: EncoderTrack;
    name: string;
    message: string;
};
