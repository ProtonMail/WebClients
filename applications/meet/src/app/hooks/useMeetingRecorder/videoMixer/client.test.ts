import type { AudioTapSamples } from '../mediaEncoder/types';
import { VideoMixerClient } from './client';
import type { SceneState } from './types';

class FakeWorker {
    public static instances: FakeWorker[] = [];

    public onmessage: ((event: { data: unknown }) => void) | null = null;
    public onerror: ((event: Event) => void) | null = null;
    public posted: { type: string; samples?: AudioTapSamples }[] = [];

    public constructor() {
        FakeWorker.instances.push(this);
    }

    public postMessage(message: { type: string; samples?: AudioTapSamples }) {
        this.posted.push(message);
    }

    public terminate() {}
}

const emptyScene: SceneState = {
    participants: [],
    isLargerThanMd: true,
    isNarrowHeight: false,
    gridLayout: { cols: 1, rows: 1 },
};

const samplesAt = (frame: number): AudioTapSamples => ({
    channels: [new Float32Array(1024)],
    frame,
    sampleRate: 48000,
});

const createClient = () => {
    const client = new VideoMixerClient({ initialScene: emptyScene, reportMeetError: vi.fn() });
    return { client, worker: FakeWorker.instances[FakeWorker.instances.length - 1] };
};

const postedAudioFrames = (worker: FakeWorker) =>
    worker.posted.filter((message) => message.type === 'provideAudioSamples').map((message) => message.samples?.frame);

describe('VideoMixerClient.provideAudioSamples', () => {
    beforeEach(() => {
        FakeWorker.instances = [];
        vi.stubGlobal('Worker', FakeWorker);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('sends only the audio provided after the encoder reported that it started', () => {
        const { client, worker } = createClient();
        client.startEncoder(vi.fn());

        client.provideAudioSamples(samplesAt(0));
        client.provideAudioSamples(samplesAt(1024));
        worker.onmessage?.({ data: { type: 'encoderStarted', audioCodec: 'aac' } });
        client.provideAudioSamples(samplesAt(2048));

        expect(postedAudioFrames(worker)).toEqual([2048]);
    });
});
