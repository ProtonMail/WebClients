import { act, renderHook, waitFor } from '@testing-library/react';

import { MicrophoneTestFailure, MicrophoneTestStatus, useMicrophoneTest } from './useMicrophoneTest';

const mockReportMeetError = vi.fn();

vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError: mockReportMeetError }),
}));

const mockSupportsSetSinkId = vi.fn();

vi.mock('../utils/browser', () => ({
    supportsSetSinkId: () => mockSupportsSetSinkId(),
}));

const mockUseNoiseCancellationModel = vi.fn();

vi.mock('../processors/noise-cancellation/useNoiseCancellationModel', () => ({
    useNoiseCancellationModel: () => mockUseNoiseCancellationModel(),
}));

const createProcessor = () => {
    let markReady: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
        markReady = resolve;
    });

    return {
        name: 'test-processor',
        processedTrack: { stop: vi.fn(), kind: 'audio', id: 'processed-track' } as unknown as MediaStreamTrack,
        init: vi.fn(async () => undefined),
        restart: vi.fn(async () => undefined),
        destroy: vi.fn(async () => undefined),
        detach: vi.fn(),
        whenReady: vi.fn(() => ready),
        markReady: () => act(() => markReady()),
    };
};

type TestProcessor = ReturnType<typeof createProcessor>;

const nativeModel = { id: 'native', isNative: true, isSupported: () => true, createProcessor: () => null };

const createModelWithProcessor = (processor: TestProcessor, audioContextSampleRate?: number) => ({
    id: 'dtln',
    isNative: false,
    audioContextSampleRate,
    isSupported: () => true,
    createProcessor: () => processor,
});

class MockBufferSource {
    public buffer: unknown = null;

    public onended: (() => void) | null = null;

    public connect = vi.fn();

    public disconnect = vi.fn();

    public start = vi.fn();

    public stop = vi.fn();
}

class MockAudioContext {
    static instances: MockAudioContext[] = [];

    /** Set to make every context created from now on refuse the requested speaker */
    static refuseSetSinkId = false;

    /** Stands in for a browser that ignores the requested sample rate */
    static forcedSampleRate: number | undefined = undefined;

    public sampleRate: number;

    public state = 'running';

    public destination = {};

    public bufferSource = new MockBufferSource();

    /** Held open by a test to stand in for a decode that takes a while */
    static decodeGate: Promise<void> | undefined = undefined;

    public decodeAudioData = vi.fn(async () => {
        await MockAudioContext.decodeGate;
        return { duration: 1 };
    });

    public resume = vi.fn(async () => undefined);

    public close = vi.fn(async () => undefined);

    public setSinkId = vi.fn(async () => {
        if (MockAudioContext.refuseSetSinkId) {
            throw new Error('refused');
        }
    });

    public createAnalyser = vi.fn(() => ({ fftSize: 256, getByteTimeDomainData: vi.fn() }));

    public createMediaStreamSource = vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() }));

    public createBufferSource = vi.fn(() => this.bufferSource);

    constructor(public options?: AudioContextOptions) {
        this.sampleRate = MockAudioContext.forcedSampleRate ?? options?.sampleRate ?? 48_000;
        MockAudioContext.instances.push(this);
    }
}

class MockMediaRecorder {
    static instances: MockMediaRecorder[] = [];

    static isTypeSupported = vi.fn(() => true);

    public state: 'inactive' | 'recording' = 'inactive';

    public mimeType = 'audio/webm;codecs=opus';

    public ondataavailable: ((event: { data: Blob }) => void) | null = null;

    public onstop: (() => void) | null = null;

    constructor(
        public stream: MediaStream,
        public options?: MediaRecorderOptions
    ) {
        MockMediaRecorder.instances.push(this);
    }

    start() {
        this.state = 'recording';
    }

    stop() {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['recorded-audio'], { type: this.mimeType }) });
        this.onstop?.();
    }
}

/** jsdom has no MediaStream, and the processor path wraps its processed track in one. */
class MockMediaStream {
    constructor(public tracks: MediaStreamTrack[] = []) {}

    getTracks() {
        return this.tracks;
    }
}

const createStream = () => {
    const track = { stop: vi.fn(), kind: 'audio', id: 'captured-track' };
    return { getTracks: () => [track], getAudioTracks: () => [track], track } as unknown as MediaStream & {
        track: { stop: ReturnType<typeof vi.fn> };
    };
};

let mockStream: ReturnType<typeof createStream>;
let mockGetUserMedia: ReturnType<typeof vi.fn>;

const lastRecorder = () => MockMediaRecorder.instances[MockMediaRecorder.instances.length - 1];
const lastContext = () => MockAudioContext.instances[MockAudioContext.instances.length - 1];

const renderMicrophoneTest = (
    microphoneDeviceId: string | null = 'mic-1',
    speakerDeviceId: string | null = null,
    noiseCancellationEnabled = false
) =>
    renderHook(
        ({ microphoneDeviceId, speakerDeviceId, noiseCancellationEnabled }) =>
            useMicrophoneTest({ microphoneDeviceId, speakerDeviceId, noiseCancellationEnabled }),
        {
            initialProps: { microphoneDeviceId, speakerDeviceId, noiseCancellationEnabled },
        }
    );

const startRecording = async (toggleTest: () => void) => {
    await act(async () => {
        toggleTest();
    });
};

describe('useMicrophoneTest', () => {
    beforeEach(() => {
        MockAudioContext.instances = [];
        MockAudioContext.refuseSetSinkId = false;
        MockAudioContext.decodeGate = undefined;
        MockMediaRecorder.instances = [];
        mockStream = createStream();
        mockGetUserMedia = vi.fn(async () => mockStream);
        mockSupportsSetSinkId.mockReturnValue(false);
        mockUseNoiseCancellationModel.mockReturnValue(nativeModel);
        MockAudioContext.forcedSampleRate = undefined;

        vi.stubGlobal('AudioContext', MockAudioContext);
        vi.stubGlobal('MediaRecorder', MockMediaRecorder);
        vi.stubGlobal('MediaStream', MockMediaStream);
        vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia: mockGetUserMedia } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('records from the selected microphone', async () => {
        const { result } = renderMicrophoneTest('mic-1');

        await startRecording(result.current.toggleTest);

        expect(mockGetUserMedia).toHaveBeenCalledWith({
            audio: expect.objectContaining({
                deviceId: { exact: 'mic-1' },
                echoCancellation: true,
                autoGainControl: true,
            }),
        });
        expect(result.current.status).toBe(MicrophoneTestStatus.Recording);
        expect(lastRecorder().state).toBe('recording');
    });

    it('omits the device constraint for the system default microphone', async () => {
        const { result } = renderMicrophoneTest(null);

        await startRecording(result.current.toggleTest);

        expect(mockGetUserMedia).toHaveBeenCalledWith({
            audio: expect.not.objectContaining({ deviceId: expect.anything() }),
        });
    });

    it('never routes the capture to the speakers', async () => {
        const { result } = renderMicrophoneTest();

        await startRecording(result.current.toggleTest);

        const source = lastContext().createMediaStreamSource.mock.results[0].value;
        expect(source.connect).toHaveBeenCalledTimes(1);
        expect(source.connect).not.toHaveBeenCalledWith(lastContext().destination);
    });

    it('releases the microphone before playing the recording back', async () => {
        const { result } = renderMicrophoneTest();

        await startRecording(result.current.toggleTest);
        const captureContext = lastContext();

        await act(async () => {
            result.current.toggleTest();
        });

        expect(mockStream.track.stop).toHaveBeenCalled();
        // The capture context stays warm for the next take, playback gets its own.
        expect(captureContext.close).not.toHaveBeenCalled();
        await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Playing));
        expect(lastContext()).not.toBe(captureContext);
        expect(lastContext().bufferSource.start).toHaveBeenCalled();
    });

    it('decodes the recording instead of using a blob url', async () => {
        const createObjectURL = vi.fn();
        vi.stubGlobal('URL', { ...URL, createObjectURL });

        const { result } = renderMicrophoneTest();
        await startRecording(result.current.toggleTest);
        await act(async () => {
            result.current.toggleTest();
        });

        await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Playing));
        expect(lastContext().decodeAudioData).toHaveBeenCalled();
        expect(createObjectURL).not.toHaveBeenCalled();
    });

    it('routes playback to the selected speaker when supported', async () => {
        mockSupportsSetSinkId.mockReturnValue(true);
        const { result } = renderMicrophoneTest('mic-1', 'speaker-9');

        await startRecording(result.current.toggleTest);
        await act(async () => {
            result.current.toggleTest();
        });

        await waitFor(() => expect(lastContext().setSinkId).toHaveBeenCalledWith('speaker-9'));
    });

    it('still plays when the speaker is refused', async () => {
        mockSupportsSetSinkId.mockReturnValue(true);
        const { result } = renderMicrophoneTest('mic-1', 'speaker-9');

        await startRecording(result.current.toggleTest);
        MockAudioContext.refuseSetSinkId = true;

        await act(async () => {
            result.current.toggleTest();
        });

        await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Playing));
        expect(result.current.failure).toBeNull();
        expect(mockReportMeetError).toHaveBeenCalledWith(
            'Microphone test could not select the speaker',
            expect.any(Error)
        );
    });

    it('returns to idle once playback ends', async () => {
        const { result } = renderMicrophoneTest();

        await startRecording(result.current.toggleTest);
        await act(async () => {
            result.current.toggleTest();
        });
        await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Playing));

        act(() => {
            lastContext().bufferSource.onended?.();
        });

        expect(result.current.status).toBe(MicrophoneTestStatus.Idle);
    });

    it('stops playback when clicked again', async () => {
        const { result } = renderMicrophoneTest();

        await startRecording(result.current.toggleTest);
        await act(async () => {
            result.current.toggleTest();
        });
        await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Playing));

        const { bufferSource } = lastContext();
        act(() => {
            result.current.toggleTest();
        });

        expect(bufferSource.stop).toHaveBeenCalled();
        expect(result.current.status).toBe(MicrophoneTestStatus.Idle);
    });

    it('aborts the test when clicked while the recording is still being decoded', async () => {
        let endTheDecode = () => {};
        MockAudioContext.decodeGate = new Promise<void>((resolve) => {
            endTheDecode = resolve;
        });

        const { result } = renderMicrophoneTest();

        await startRecording(result.current.toggleTest);
        await act(async () => {
            result.current.toggleTest();
        });

        // The capture is released as soon as the recorder stops, well before playback can start
        expect(result.current.status).toBe(MicrophoneTestStatus.Playing);

        act(() => {
            result.current.toggleTest();
        });

        expect(result.current.status).toBe(MicrophoneTestStatus.Idle);

        const playbackContext = lastContext();
        await act(async () => {
            endTheDecode();
        });

        expect(playbackContext.bufferSource.start).not.toHaveBeenCalled();
        expect(playbackContext.close).toHaveBeenCalled();
        expect(result.current.status).toBe(MicrophoneTestStatus.Idle);
    });

    it('stops the recording automatically after the maximum duration', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const { result } = renderMicrophoneTest();

        await startRecording(result.current.toggleTest);

        await act(async () => {
            vi.advanceTimersByTime(6_000);
        });

        expect(lastRecorder().state).toBe('inactive');
        await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Playing));
        vi.useRealTimers();
    });

    it('ignores a second start while the first is still acquiring the device', async () => {
        const { result } = renderMicrophoneTest();

        await act(async () => {
            result.current.toggleTest();
            result.current.toggleTest();
        });

        expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
        expect(MockMediaRecorder.instances).toHaveLength(1);
    });

    it('aborts without playing back when the microphone is switched', async () => {
        const { result, rerender } = renderMicrophoneTest('mic-1');

        await startRecording(result.current.toggleTest);

        await act(async () => {
            rerender({ microphoneDeviceId: 'mic-2', speakerDeviceId: null, noiseCancellationEnabled: false });
        });

        expect(mockStream.track.stop).toHaveBeenCalled();
        expect(result.current.status).toBe(MicrophoneTestStatus.Idle);
        expect(lastContext().createBufferSource).not.toHaveBeenCalled();
    });

    it('releases the microphone on unmount', async () => {
        const { result, unmount } = renderMicrophoneTest();

        await startRecording(result.current.toggleTest);
        unmount();

        expect(mockStream.track.stop).toHaveBeenCalled();
    });

    it.each([
        ['NotAllowedError', MicrophoneTestFailure.Permission],
        ['NotFoundError', MicrophoneTestFailure.NotFound],
        ['NotReadableError', MicrophoneTestFailure.Busy],
        ['SomethingElseError', MicrophoneTestFailure.Unknown],
    ])('maps a %s to the %s failure', async (errorName, expected) => {
        mockGetUserMedia.mockRejectedValueOnce(new DOMException('nope', errorName));
        const { result } = renderMicrophoneTest();

        await startRecording(result.current.toggleTest);

        expect(result.current.failure).toBe(expected);
        expect(result.current.status).toBe(MicrophoneTestStatus.Idle);
        expect(mockReportMeetError).toHaveBeenCalledWith('Microphone test failed to start', expect.any(DOMException));
    });

    describe('noise cancellation', () => {
        // The native model has no processor, so the browser constraint follows the setting.
        it.each([true, false])('asks the browser for noiseSuppression: %s', async (enabled) => {
            const { result } = renderMicrophoneTest('mic-1', null, enabled);

            await startRecording(result.current.toggleTest);

            expect(mockGetUserMedia).toHaveBeenCalledWith({
                audio: expect.objectContaining({ noiseSuppression: enabled }),
            });
        });

        it('records the processed track and leaves the native constraint off', async () => {
            const processor = createProcessor();
            mockUseNoiseCancellationModel.mockReturnValue(createModelWithProcessor(processor, 16_000));
            const { result } = renderMicrophoneTest('mic-1', null, true);

            await startRecording(result.current.toggleTest);
            processor.markReady();
            await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Recording));

            expect(mockGetUserMedia).toHaveBeenCalledWith({
                audio: expect.objectContaining({ noiseSuppression: false }),
            });
            expect(lastContext().options).toEqual({ sampleRate: 16_000 });
            expect(processor.init).toHaveBeenCalledWith(
                expect.objectContaining({ audioContext: lastContext(), track: mockStream.track })
            );
            expect(lastRecorder().stream.getTracks()).toEqual([processor.processedTrack]);
        });

        it('skips the model when noise cancellation is off', async () => {
            const processor = createProcessor();
            mockUseNoiseCancellationModel.mockReturnValue(createModelWithProcessor(processor, 16_000));
            const { result } = renderMicrophoneTest('mic-1', null, false);

            await startRecording(result.current.toggleTest);

            expect(processor.init).not.toHaveBeenCalled();
            expect(lastRecorder().stream.getTracks()).toEqual([mockStream.track]);
        });

        it('skips the model when the browser ignores its sample rate', async () => {
            const processor = createProcessor();
            mockUseNoiseCancellationModel.mockReturnValue(createModelWithProcessor(processor, 16_000));
            MockAudioContext.forcedSampleRate = 48_000;
            const { result } = renderMicrophoneTest('mic-1', null, true);

            await startRecording(result.current.toggleTest);

            expect(processor.init).not.toHaveBeenCalled();
            expect(result.current.status).toBe(MicrophoneTestStatus.Recording);
        });

        it('detaches the model when the take ends, keeping it loaded', async () => {
            const processor = createProcessor();
            mockUseNoiseCancellationModel.mockReturnValue(createModelWithProcessor(processor, 16_000));
            const { result } = renderMicrophoneTest('mic-1', null, true);

            await startRecording(result.current.toggleTest);
            processor.markReady();
            await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Recording));

            await act(async () => {
                result.current.toggleTest();
            });

            expect(processor.detach).toHaveBeenCalled();
            expect(processor.destroy).not.toHaveBeenCalled();
        });

        it('reports preparing while the model warms up, and records once it is ready', async () => {
            const processor = createProcessor();
            mockUseNoiseCancellationModel.mockReturnValue(createModelWithProcessor(processor, 16_000));
            const { result } = renderMicrophoneTest('mic-1', null, true);

            await startRecording(result.current.toggleTest);

            expect(result.current.status).toBe(MicrophoneTestStatus.Preparing);
            expect(lastRecorder().state).toBe('inactive');

            processor.markReady();

            await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Recording));
            expect(lastRecorder().state).toBe('recording');
        });

        it('gives up on the model when clicked while preparing', async () => {
            const processor = createProcessor();
            mockUseNoiseCancellationModel.mockReturnValue(createModelWithProcessor(processor, 16_000));
            const { result } = renderMicrophoneTest('mic-1', null, true);

            await startRecording(result.current.toggleTest);
            expect(result.current.status).toBe(MicrophoneTestStatus.Preparing);

            await act(async () => {
                result.current.toggleTest();
            });

            // Released straight away rather than waiting for the model to settle.
            expect(result.current.status).toBe(MicrophoneTestStatus.Idle);
            expect(mockStream.track.stop).toHaveBeenCalled();
            expect(processor.detach).toHaveBeenCalled();

            processor.markReady();
            await waitFor(() => expect(lastRecorder().state).toBe('inactive'));
            expect(result.current.status).toBe(MicrophoneTestStatus.Idle);
        });

        it('warms the model once and re-uses it for later takes', async () => {
            const processor = createProcessor();
            mockUseNoiseCancellationModel.mockReturnValue(createModelWithProcessor(processor, 16_000));
            const { result } = renderMicrophoneTest('mic-1', null, true);

            await startRecording(result.current.toggleTest);
            processor.markReady();
            await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Recording));
            const warmContext = MockAudioContext.instances[0];

            await act(async () => {
                result.current.toggleTest();
            });
            await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Playing));

            act(() => {
                result.current.toggleTest();
            });
            await startRecording(result.current.toggleTest);

            // Same context, same processor, detached in between rather than destroyed.
            expect(result.current.status).toBe(MicrophoneTestStatus.Recording);
            expect(processor.detach).toHaveBeenCalled();
            expect(processor.destroy).not.toHaveBeenCalled();
            expect(processor.init).toHaveBeenCalledTimes(2);
            expect(warmContext.close).not.toHaveBeenCalled();
        });

        // Joining the meeting closes the settings dropdown, which unmounts the test.
        it('releases the device and unloads the model on unmount', async () => {
            const processor = createProcessor();
            mockUseNoiseCancellationModel.mockReturnValue(createModelWithProcessor(processor, 16_000));
            const { result, unmount } = renderMicrophoneTest('mic-1', null, true);

            await startRecording(result.current.toggleTest);
            processor.markReady();
            await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Recording));
            const warmContext = MockAudioContext.instances[0];

            unmount();

            expect(mockStream.track.stop).toHaveBeenCalled();
            expect(processor.destroy).toHaveBeenCalled();
            expect(warmContext.close).toHaveBeenCalled();
        });

        it('rebuilds the pipeline when the model changes', async () => {
            const dtln = createProcessor();
            mockUseNoiseCancellationModel.mockReturnValue(createModelWithProcessor(dtln, 16_000));
            const { result, rerender } = renderMicrophoneTest('mic-1', null, true);

            await startRecording(result.current.toggleTest);
            dtln.markReady();
            await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Recording));
            const dtlnContext = MockAudioContext.instances[0];

            // Out of recording, then out of playback, back to idle.
            await act(async () => {
                result.current.toggleTest();
            });
            await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Playing));
            act(() => {
                result.current.toggleTest();
            });

            const krisp = createProcessor();
            mockUseNoiseCancellationModel.mockReturnValue({
                id: 'krisp',
                isNative: false,
                isSupported: () => true,
                createProcessor: () => krisp,
            });
            await act(async () => {
                rerender({ microphoneDeviceId: 'mic-1', speakerDeviceId: null, noiseCancellationEnabled: true });
            });
            await startRecording(result.current.toggleTest);
            krisp.markReady();
            await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Recording));

            expect(dtln.destroy).toHaveBeenCalled();
            expect(dtlnContext.close).toHaveBeenCalled();
            expect(krisp.init).toHaveBeenCalled();
        });

        it('records anyway when the model never becomes ready', async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const processor = createProcessor();
            mockUseNoiseCancellationModel.mockReturnValue(createModelWithProcessor(processor, 16_000));
            const { result } = renderMicrophoneTest('mic-1', null, true);

            await startRecording(result.current.toggleTest);
            await act(async () => {
                vi.advanceTimersByTime(5_000);
            });

            await waitFor(() => expect(result.current.status).toBe(MicrophoneTestStatus.Recording));
            expect(mockReportMeetError).toHaveBeenCalledWith(
                'Microphone test recorded before the model was ready',
                expect.anything()
            );
            vi.useRealTimers();
        });
    });
});
