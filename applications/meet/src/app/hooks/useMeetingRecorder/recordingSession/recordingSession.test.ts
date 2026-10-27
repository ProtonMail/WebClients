import type { OpfsRecording } from '@proton/meet/store/slices/recordingsSlice';
import { TimeoutError } from '@proton/meet/utils/withTimeout';

import { WEBCODECS_MP4_CODEC } from '../mediaEncoder/webCodecsRecorder';
import { RecordingSession } from './recordingSession';

const boundary = vi.hoisted(() => {
    const state: {
        stopEncoder: (emitChunk: () => void) => Promise<void>;
        finalize: () => Promise<OpfsRecording | null>;
        lastChunkWrittenAt: number | null;
    } = {
        stopEncoder: () => Promise.resolve(),
        finalize: () => Promise.resolve(null),
        lastChunkWrittenAt: null,
    };
    return state;
});

vi.mock('../videoMixer/client', () => ({
    VideoMixerClient: class {
        private onChunk: (data: Uint8Array<ArrayBuffer>) => void = () => {};

        public startEncoder(onChunk: (data: Uint8Array<ArrayBuffer>) => void) {
            this.onChunk = onChunk;
        }

        public stopEncoder() {
            return boundary.stopEncoder(() => this.onChunk(new Uint8Array(1024)));
        }

        public updateRecordedTracks() {}

        public updateScene() {}

        public provideAudioSamples() {}

        public getAudioCodec() {
            return 'mp4a.40.2';
        }

        public cleanup() {}
    },
}));

vi.mock('../audioMixer/audioMixer', () => ({
    createAudioMixer: async () => ({
        updateAudioSources: () => {},
        startWorkletTap: async () => {},
        stopWorkletTap: () => {},
        getDiagnostics: () => null,
        cleanup: () => {},
    }),
}));

vi.mock('../recordingStorage/client', () => ({
    createRecordingStorageClient: async () => ({
        addChunk: async () => {},
        finalize: () => boundary.finalize(),
        getLastChunkWrittenAt: () => boundary.lastChunkWrittenAt,
        getPendingWriteCount: () => 0,
        clear: async () => {},
        terminate: () => {},
    }),
}));

const STOP_IDLE_TIMEOUT_MS = 15_000;

const recordedFile: OpfsRecording = { name: 'recording', extension: 'mp4', createdAt: 0, size: 2048 };

const neverSettles = <T>() => new Promise<T>(() => {});

const startSession = async () => {
    const session = new RecordingSession({
        codec: WEBCODECS_MP4_CODEC,
        isWebCodecs: true,
        userId: 'user-id',
        reportMeetError: vi.fn(),
        onRuntimeError: vi.fn(),
        onStorageFull: vi.fn(),
        onWriteError: vi.fn(),
    });
    await session.start({
        initialScene: {
            participants: [],
            isLargerThanMd: true,
            isNarrowHeight: false,
            gridLayout: { cols: 1, rows: 1 },
        },
        initialAudioTracks: [],
        initialRecordedTracks: [],
    });
    return session;
};

const resolveAfter = <T>(delayMs: number, value: T) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(value), delayMs));

const repeatUntil = (intervalMs: number, durationMs: number, onTick: () => void) => {
    const interval = setInterval(onTick, intervalMs);
    return resolveAfter(durationMs, undefined).then(() => clearInterval(interval));
};

describe('RecordingSession.stop', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'] });
        boundary.stopEncoder = () => Promise.resolve();
        boundary.finalize = () => Promise.resolve(recordedFile);
        boundary.lastChunkWrittenAt = null;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('rejects with a TimeoutError when the encoder never finishes and emits nothing', async () => {
        boundary.stopEncoder = () => neverSettles();
        const session = await startSession();

        const assertion = expect(session.stop()).rejects.toBeInstanceOf(TimeoutError);
        await vi.advanceTimersByTimeAsync(STOP_IDLE_TIMEOUT_MS);

        await assertion;
    });

    it('rejects with a TimeoutError when finalizing the storage never finishes and no write completes', async () => {
        boundary.finalize = () => neverSettles();
        const session = await startSession();

        const assertion = expect(session.stop()).rejects.toBeInstanceOf(TimeoutError);
        await vi.advanceTimersByTimeAsync(STOP_IDLE_TIMEOUT_MS);

        await assertion;
    });

    it('resolves with the file after a 60 s encoder flush that emits a chunk every 5 s', async () => {
        boundary.stopEncoder = (emitChunk) => repeatUntil(5_000, 60_000, emitChunk);
        const session = await startSession();

        const result = session.stop();
        await vi.advanceTimersByTimeAsync(60_000);

        await expect(result).resolves.toBe(recordedFile);
    });

    it('resolves with the file after a 60 s storage drain that completes a write every 5 s', async () => {
        boundary.finalize = () => {
            void repeatUntil(5_000, 60_000, () => {
                boundary.lastChunkWrittenAt = performance.now();
            });
            return resolveAfter(60_000, recordedFile);
        };
        const session = await startSession();

        const result = session.stop();
        await vi.advanceTimersByTimeAsync(60_000);

        await expect(result).resolves.toBe(recordedFile);
    });

    it('requests the encoder stop once and resolves both callers with the file when stop is called again mid-flush', async () => {
        let stopEncoderCalls = 0;
        boundary.stopEncoder = () => {
            stopEncoderCalls += 1;
            return resolveAfter(5_000, undefined);
        };
        const session = await startSession();

        const firstStop = session.stop();
        await vi.advanceTimersByTimeAsync(1_000);
        const secondStop = session.stop();
        await vi.advanceTimersByTimeAsync(5_000);

        await expect(firstStop).resolves.toBe(recordedFile);
        await expect(secondStop).resolves.toBe(recordedFile);
        expect(stopEncoderCalls).toBe(1);
    });
});
