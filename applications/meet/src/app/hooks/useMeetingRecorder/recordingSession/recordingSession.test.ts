import type { OpfsRecording } from '@proton/meet/store/slices/recordingsSlice';
import { TimeoutError } from '@proton/meet/utils/withTimeout';

import type { EncoderFailure } from '../mediaEncoder/types';
import { WEBCODECS_MP4_CODEC } from '../mediaEncoder/webCodecsRecorder';
import { RecordingSession } from './recordingSession';
import type { RecordingSessionOptions } from './types';

const boundary = vi.hoisted(() => {
    const state: {
        stopEncoder: (emitChunk: () => void) => Promise<void>;
        finalize: () => Promise<OpfsRecording | null>;
        clear: () => Promise<void>;
        lastChunkWrittenAt: number | null;
        encoderFailureOnStart: EncoderFailure | null;
        reportEncoderFailure: (failure: EncoderFailure) => void;
    } = {
        stopEncoder: () => Promise.resolve(),
        finalize: () => Promise.resolve(null),
        clear: () => Promise.resolve(),
        lastChunkWrittenAt: null,
        encoderFailureOnStart: null,
        reportEncoderFailure: () => {},
    };
    return state;
});

vi.mock('../videoMixer/client', () => ({
    VideoMixerClient: class {
        private onChunk: (data: Uint8Array<ArrayBuffer>) => void = () => {};

        public startEncoder(
            onChunk: (data: Uint8Array<ArrayBuffer>) => void,
            onFailure: (failure: EncoderFailure) => void
        ) {
            this.onChunk = onChunk;
            boundary.reportEncoderFailure = onFailure;
            if (boundary.encoderFailureOnStart) {
                onFailure(boundary.encoderFailureOnStart);
            }
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
        clear: () => boundary.clear(),
        terminate: () => {},
    }),
}));

const STOP_IDLE_TIMEOUT_MS = 15_000;

const recordedFile: OpfsRecording = { name: 'recording', extension: 'mp4', createdAt: 0, size: 2048 };

const neverSettles = <T>() => new Promise<T>(() => {});

const startSession = async (options: Partial<RecordingSessionOptions> = {}) => {
    const session = new RecordingSession({
        codec: WEBCODECS_MP4_CODEC,
        isWebCodecs: true,
        userId: 'user-id',
        reportMeetError: vi.fn(),
        onRuntimeError: vi.fn(),
        onStorageFull: vi.fn(),
        onWriteError: vi.fn(),
        onEncoderError: vi.fn(),
        ...options,
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

    it('finalizes the storage and keeps the file when the encoder stop times out', async () => {
        boundary.stopEncoder = () => neverSettles();
        const finalize = vi.fn(() => Promise.resolve(recordedFile));
        boundary.finalize = finalize;
        const session = await startSession();

        const assertion = expect(session.stop()).rejects.toBeInstanceOf(TimeoutError);
        await vi.advanceTimersByTimeAsync(STOP_IDLE_TIMEOUT_MS);
        await assertion;

        expect(finalize).toHaveBeenCalledTimes(1);
        expect(session.getDiagnostics().stopReport?.file).toBe(recordedFile);
    });

    it('does not finalize the storage again when the storage finalize is what timed out', async () => {
        const finalize = vi.fn(() => neverSettles<OpfsRecording | null>());
        boundary.finalize = finalize;
        const session = await startSession();

        const assertion = expect(session.stop()).rejects.toBeInstanceOf(TimeoutError);
        await vi.advanceTimersByTimeAsync(STOP_IDLE_TIMEOUT_MS);
        await assertion;

        expect(finalize).toHaveBeenCalledTimes(1);
    });

    it('settles a second stop only after the storage finalize that recovers a timed-out encoder stop', async () => {
        boundary.stopEncoder = () => neverSettles();
        let resolveFinalize: (file: OpfsRecording) => void = () => {};
        boundary.finalize = () =>
            new Promise((resolve) => {
                resolveFinalize = resolve;
            });
        const session = await startSession();

        const firstStop = session.stop().catch((error: unknown) => error);
        let isSecondStopSettled = false;
        const secondStop = session
            .stop()
            .catch((error: unknown) => error)
            .finally(() => {
                isSecondStopSettled = true;
            });
        await vi.advanceTimersByTimeAsync(STOP_IDLE_TIMEOUT_MS);

        expect(isSecondStopSettled).toBe(false);

        resolveFinalize(recordedFile);
        await expect(firstStop).resolves.toBeInstanceOf(TimeoutError);
        await expect(secondStop).resolves.toBeInstanceOf(TimeoutError);
        expect(session.getDiagnostics().stopReport?.file).toBe(recordedFile);
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

describe('RecordingSession encoder failure', () => {
    const videoEncoderFailure: EncoderFailure = { track: 'video', name: 'EncodingError', message: 'Encoder failure' };

    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'] });
        boundary.stopEncoder = () => Promise.resolve();
        boundary.finalize = () => Promise.resolve(recordedFile);
        boundary.clear = vi.fn(() => Promise.resolve());
        boundary.encoderFailureOnStart = null;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('reports an encoder failure during the recording and asks to finish it', async () => {
        const reportMeetError = vi.fn();
        const onEncoderError = vi.fn();
        await startSession({ reportMeetError, onEncoderError });

        boundary.reportEncoderFailure(videoEncoderFailure);

        expect(reportMeetError).toHaveBeenCalledWith('MeetingRecording Error WebCodecs: encoder failed', {
            context: expect.objectContaining({
                track: 'video',
                name: 'EncodingError',
                message: 'Encoder failure',
                chunksWithData: 0,
            }),
        });
        expect(onEncoderError).toHaveBeenCalledTimes(1);
    });

    it('fails to start and clears the file when the encoder fails before the recording started', async () => {
        boundary.encoderFailureOnStart = videoEncoderFailure;
        const onEncoderError = vi.fn();

        await expect(startSession({ onEncoderError })).rejects.toThrow('The recording encoder failed: Encoder failure');

        expect(boundary.clear).toHaveBeenCalledTimes(1);
        expect(onEncoderError).not.toHaveBeenCalled();
    });
});
