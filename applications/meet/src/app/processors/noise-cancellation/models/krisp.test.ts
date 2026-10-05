import type { AudioProcessorOptions, Room } from 'livekit-client';

import { KRISP_OVERFLOWS_BEFORE_GIVING_UP, createKrispModel } from './krisp';

const krispOptions: { onBufferDrop?: () => void }[] = [];
const expectBoundToProcessor = (self: { name?: string } | undefined) => {
    if (self?.name !== 'livekit-noise-filter') {
        throw new Error('Called without the processor as `this`');
    }
};
const originalInit = vi.fn(async function (this: { name?: string } | undefined) {
    expectBoundToProcessor(this);
});
const originalRestart = vi.fn(async function (this: { name?: string } | undefined) {
    expectBoundToProcessor(this);
});

vi.mock('@livekit/krisp-noise-filter', () => ({
    isKrispNoiseFilterSupported: () => true,
    KrispNoiseFilter: (options: { onBufferDrop?: () => void }) => {
        krispOptions.push(options);
        return { name: 'livekit-noise-filter', init: originalInit, restart: originalRestart, destroy: vi.fn() };
    },
}));

vi.mock('../getDevicePerformanceContext', () => ({
    getDevicePerformanceContext: async () => ({ hardwareConcurrency: 4 }),
}));

const room = { serverInfo: { edition: 1 } } as unknown as Room;
const startOptions = { audioContext: { sampleRate: 48000 } } as unknown as AudioProcessorOptions;

const setup = () => {
    const reportError = vi.fn();
    const onDisabledForPerformance = vi.fn();
    const model = createKrispModel(room, { debugLogs: false, reportError });
    const processor = model.createProcessor({ onDisabledForPerformance })!;
    const overflow = (times = 1) => {
        for (let i = 0; i < times; i++) {
            krispOptions.at(-1)!.onBufferDrop!();
        }
    };
    return { reportError, onDisabledForPerformance, processor, overflow };
};

describe('createKrispModel', () => {
    beforeEach(() => {
        krispOptions.length = 0;
        vi.clearAllMocks();
    });

    it('reports every overflow with the device context', async () => {
        const { reportError, processor, overflow } = setup();
        await processor.init(startOptions);

        overflow();

        await vi.waitFor(() => expect(reportError).toHaveBeenCalledTimes(1));
        expect(reportError).toHaveBeenCalledWith('Krisp noise filter paused after buffer overflow', {
            level: 'warning',
            tags: { feature: 'noise-cancellation', noiseCancellationModel: 'krisp' },
            context: expect.objectContaining({ overflowCount: 1, hardwareConcurrency: 4 }),
        });
    });

    it('signals once, on the overflow Krisp gives up at', async () => {
        const { reportError, onDisabledForPerformance, processor, overflow } = setup();
        await processor.init(startOptions);

        overflow(KRISP_OVERFLOWS_BEFORE_GIVING_UP - 1);
        expect(onDisabledForPerformance).not.toHaveBeenCalled();

        overflow(2);
        expect(onDisabledForPerformance).toHaveBeenCalledTimes(1);

        await vi.waitFor(() => expect(reportError).toHaveBeenCalledTimes(KRISP_OVERFLOWS_BEFORE_GIVING_UP + 1));
        expect(reportError).toHaveBeenCalledWith(
            'Krisp noise filter disabled after repeated buffer overflows',
            expect.objectContaining({
                context: expect.objectContaining({ overflowCount: KRISP_OVERFLOWS_BEFORE_GIVING_UP }),
            })
        );
    });

    it('starts counting again after a restart, like the fresh Krisp worklet does', async () => {
        const { onDisabledForPerformance, processor, overflow } = setup();
        await processor.init(startOptions);

        overflow(KRISP_OVERFLOWS_BEFORE_GIVING_UP - 1);
        await processor.restart(startOptions);
        overflow(KRISP_OVERFLOWS_BEFORE_GIVING_UP - 1);

        expect(onDisabledForPerformance).not.toHaveBeenCalled();
        expect(originalRestart).toHaveBeenCalledWith(startOptions);
    });

    it('gives every processor its own count', async () => {
        const first = setup();
        await first.processor.init(startOptions);
        first.overflow(KRISP_OVERFLOWS_BEFORE_GIVING_UP - 1);

        const second = setup();
        await second.processor.init(startOptions);
        second.overflow(KRISP_OVERFLOWS_BEFORE_GIVING_UP - 1);

        expect(first.onDisabledForPerformance).not.toHaveBeenCalled();
        expect(second.onDisabledForPerformance).not.toHaveBeenCalled();
        expect(originalInit).toHaveBeenCalledTimes(2);
    });
});
