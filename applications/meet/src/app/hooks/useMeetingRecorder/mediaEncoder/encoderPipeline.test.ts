import { EncoderPipeline } from './encoderPipeline';
import type { AudioTapSamples } from './types';

const mediabunny = vi.hoisted(() => ({
    addVideoFrame: vi.fn<() => Promise<void>>(),
    addAudioSample: vi.fn<() => Promise<void>>(),
    finalize: vi.fn<() => Promise<void>>(),
}));

vi.mock('mediabunny', () => ({
    Output: class {
        public addVideoTrack() {}

        public addAudioTrack() {}

        public async start() {}

        public finalize() {
            return mediabunny.finalize();
        }
    },
    Mp4OutputFormat: class {},
    AppendOnlyStreamTarget: class {},
    CanvasSource: class {
        public add() {
            return mediabunny.addVideoFrame();
        }
    },
    AudioSampleSource: class {
        public add() {
            return mediabunny.addAudioSample();
        }
    },
    AudioSample: class {
        public close() {}
    },
}));

const samplesAt = (frame: number): AudioTapSamples => ({
    channels: [new Float32Array(1024)],
    frame,
    sampleRate: 48000,
});

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const createPipeline = () => {
    const onError = vi.fn();
    const pipeline = new EncoderPipeline({} as OffscreenCanvas, 30, 'aac', vi.fn(), onError);
    return { pipeline, onError };
};

beforeEach(() => {
    mediabunny.addVideoFrame.mockResolvedValue(undefined);
    mediabunny.addAudioSample.mockResolvedValue(undefined);
    mediabunny.finalize.mockResolvedValue(undefined);
});

afterEach(() => {
    vi.resetAllMocks();
});

describe('EncoderPipeline encoder failures', () => {
    it('reports a failed video encoder and stops without finalizing the file', async () => {
        const encoderError = new DOMException('Encoder failure', 'EncodingError');
        mediabunny.addVideoFrame.mockRejectedValue(encoderError);
        const { pipeline, onError } = createPipeline();

        await pipeline.start();
        await flushPromises();
        await pipeline.stop();

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith('video', encoderError);
        expect(mediabunny.finalize).not.toHaveBeenCalled();
    });

    it('reports only the first failure of the audio encoder', async () => {
        const encoderError = new DOMException('Encoder failure', 'EncodingError');
        mediabunny.addAudioSample.mockRejectedValue(encoderError);
        const { pipeline, onError } = createPipeline();

        await pipeline.start();
        pipeline.addAudioSamples(samplesAt(0));
        pipeline.addAudioSamples(samplesAt(1024));
        pipeline.addAudioSamples(samplesAt(2048));
        await flushPromises();
        await pipeline.stop();

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith('audio', encoderError);
    });
});
