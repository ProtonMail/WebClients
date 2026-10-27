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

const getSettledState = (promise: Promise<void>) =>
    Promise.race([
        promise.then(() => 'resolved'),
        new Promise<string>((resolve) => setTimeout(() => resolve('pending'), 0)),
    ]);

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
    const reportMeetError = vi.fn();
    const client = new VideoMixerClient({ initialScene: emptyScene, reportMeetError });
    return { client, reportMeetError, worker: FakeWorker.instances[FakeWorker.instances.length - 1] };
};

const postedAudioFrames = (worker: FakeWorker) =>
    worker.posted.filter((message) => message.type === 'provideAudioSamples').map((message) => message.samples?.frame);

beforeEach(() => {
    FakeWorker.instances = [];
    vi.stubGlobal('Worker', FakeWorker);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('VideoMixerClient.provideAudioSamples', () => {
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

describe('VideoMixerClient render worker error report', () => {
    it('flags a worker that failed to load', () => {
        const { reportMeetError, worker } = createClient();

        worker.onerror?.(new Event('error'));

        expect(reportMeetError).toHaveBeenCalledWith('MeetingRecording Error: renderWorker uncaught error', {
            context: { message: undefined, filename: undefined, lineno: undefined, workerFailedToLoad: true },
        });
    });

    it('does not flag an uncaught error in a running worker', () => {
        const { reportMeetError, worker } = createClient();

        worker.onerror?.(new ErrorEvent('error', { message: 'render failed', filename: 'worker.ts', lineno: 12 }));

        expect(reportMeetError).toHaveBeenCalledWith('MeetingRecording Error: renderWorker uncaught error', {
            context: { message: 'render failed', filename: 'worker.ts', lineno: 12, workerFailedToLoad: false },
        });
    });
});

describe('VideoMixerClient.stopEncoder', () => {
    it('resolves without waiting for encoderDone when the worker failed to load', async () => {
        const { client, worker } = createClient();

        worker.onerror?.(new Event('error'));

        await expect(getSettledState(client.stopEncoder())).resolves.toBe('resolved');
    });

    it('waits for encoderDone after an uncaught error in a running worker', async () => {
        const { client, worker } = createClient();

        worker.onerror?.(new ErrorEvent('error', { message: 'render failed' }));
        const stopped = client.stopEncoder();

        await expect(getSettledState(stopped)).resolves.toBe('pending');

        worker.onmessage?.({ data: { type: 'encoderDone' } });

        await expect(getSettledState(stopped)).resolves.toBe('resolved');
    });
});
