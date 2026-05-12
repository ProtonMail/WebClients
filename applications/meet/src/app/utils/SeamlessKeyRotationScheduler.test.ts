import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProtonMeetKeyProvider } from './ProtonMeetKeyProvider';
import { KeyRotationScheduler } from './SeamlessKeyRotationScheduler';

const createKeyProvider = () => {
    let currentKey: string | undefined;
    let currentEpoch: bigint | undefined;
    const setKeyWithEpoch = vi.fn(async (_key: string, _epoch: bigint) => true);
    const cleanCurrent = vi.fn(() => {
        currentKey = undefined;
        currentEpoch = undefined;
    });

    return {
        keyProvider: {
            setKeyWithEpoch,
            setCurrentKey: (key: string) => {
                currentKey = key;
            },
            setCurrentEpoch: (epoch: bigint) => {
                currentEpoch = epoch;
            },
            getCurrentKey: () => currentKey,
            getCurrentEpoch: () => currentEpoch,
            cleanCurrent,
        } as unknown as ProtonMeetKeyProvider,
        setKeyWithEpoch,
        cleanCurrent,
        getCurrent: () => ({ key: currentKey, epoch: currentEpoch }),
    };
};

describe('KeyRotationScheduler', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('activates the first key immediately without scheduling grace', async () => {
        const { keyProvider, setKeyWithEpoch, getCurrent } = createKeyProvider();
        const scheduler = new KeyRotationScheduler(keyProvider);

        await scheduler.schedule('key-1', 1n);
        await vi.advanceTimersByTimeAsync(3000);

        expect(setKeyWithEpoch).toHaveBeenCalledTimes(1);
        expect(setKeyWithEpoch).toHaveBeenCalledWith('key-1', 1n);
        expect(getCurrent()).toEqual({ key: 'key-1', epoch: 1n });
    });

    it('keeps encrypting with the held epoch during grace and switches to the latest pending epoch', async () => {
        const { keyProvider, setKeyWithEpoch, getCurrent } = createKeyProvider();
        const scheduler = new KeyRotationScheduler(keyProvider);

        await scheduler.schedule('key-1', 1n);
        await scheduler.schedule('key-2', 2n, 3000, 5000);
        await vi.advanceTimersByTimeAsync(1000);
        await scheduler.schedule('key-3', 3n, 3000, 5000);

        expect(setKeyWithEpoch.mock.calls).toEqual([
            ['key-1', 1n],
            ['key-2', 2n],
            ['key-1', 1n],
            ['key-3', 3n],
            ['key-1', 1n],
        ]);

        await vi.advanceTimersByTimeAsync(3000);

        expect(setKeyWithEpoch.mock.calls).toEqual([
            ['key-1', 1n],
            ['key-2', 2n],
            ['key-1', 1n],
            ['key-3', 3n],
            ['key-1', 1n],
            ['key-3', 3n],
        ]);
        expect(getCurrent()).toEqual({ key: 'key-3', epoch: 3n });
    });

    it('caps the grace window from the first pending rotation during commit bursts', async () => {
        const { keyProvider, setKeyWithEpoch, getCurrent } = createKeyProvider();
        const scheduler = new KeyRotationScheduler(keyProvider);

        await scheduler.schedule('key-1', 1n);
        await scheduler.schedule('key-2', 2n, 3000, 5000);

        await vi.advanceTimersByTimeAsync(2500);
        await scheduler.schedule('key-3', 3n, 3000, 5000);

        await vi.advanceTimersByTimeAsync(2000);
        await scheduler.schedule('key-4', 4n, 3000, 5000);

        await vi.advanceTimersByTimeAsync(499);
        expect(setKeyWithEpoch).not.toHaveBeenLastCalledWith('key-4', 4n);

        await vi.advanceTimersByTimeAsync(1);
        expect(setKeyWithEpoch).toHaveBeenLastCalledWith('key-4', 4n);
        expect(getCurrent()).toEqual({ key: 'key-4', epoch: 4n });
    });

    it('cleans pending rotation state and cancels activation', async () => {
        const { keyProvider, setKeyWithEpoch, cleanCurrent } = createKeyProvider();
        const scheduler = new KeyRotationScheduler(keyProvider);

        await scheduler.schedule('key-1', 1n);
        await scheduler.schedule('key-2', 2n);

        scheduler.clean();
        await vi.advanceTimersByTimeAsync(3000);

        expect(setKeyWithEpoch.mock.calls).toEqual([
            ['key-1', 1n],
            ['key-2', 2n],
            ['key-1', 1n],
        ]);
        expect(cleanCurrent).toHaveBeenCalledTimes(1);
    });
});
