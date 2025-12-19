import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStuckTrackMonitor } from './useStuckTrackMonitor';

const createPublication = (trackSid: string) => {
    return {
        trackSid,
        setEnabled: vi.fn(),
        setSubscribed: vi.fn(),
    } as any;
};

describe('useStuckTrackMonitor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
        vi.spyOn(Math, 'random').mockReturnValue(0);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('calls resetTrack when the check marks a publication as stuck', async () => {
        const publication = createPublication('track-1');
        const getTracksToMonitor = vi.fn(() => [publication]);
        const checkTrackStats = vi.fn().mockResolvedValue({ currentValue: 0, isStuck: true });
        const resetTrack = vi.fn().mockResolvedValue(undefined);

        const { unmount } = renderHook(() =>
            useStuckTrackMonitor({
                checkIntervalMs: 1000,
                minExpectedDelta: 1,
                getTracksToMonitor,
                checkTrackStats,
                resetTrack,
            })
        );

        expect(checkTrackStats).not.toHaveBeenCalled();
        expect(resetTrack).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1001);

        expect(checkTrackStats).toHaveBeenCalledWith(publication);
        expect(resetTrack).toHaveBeenCalledTimes(1);
        expect(resetTrack).toHaveBeenCalledWith(publication);

        unmount();
    });

    it('does not trigger a concurrent reset while a previous reset is still in progress', async () => {
        const publication = createPublication('track-1');
        const getTracksToMonitor = vi.fn(() => [publication]);
        const checkTrackStats = vi.fn().mockResolvedValue({ currentValue: 0, isStuck: true });

        let resolveReset!: () => void;
        const resetTrack = vi.fn(
            () =>
                new Promise<void>((resolve) => {
                    resolveReset = resolve;
                })
        );

        const { unmount } = renderHook(() =>
            useStuckTrackMonitor({
                checkIntervalMs: 1000,
                minExpectedDelta: 1,
                getTracksToMonitor,
                checkTrackStats,
                resetTrack,
            })
        );

        await vi.advanceTimersByTimeAsync(1001);
        expect(resetTrack).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1001);
        expect(resetTrack).toHaveBeenCalledTimes(1);

        resolveReset();

        await vi.advanceTimersByTimeAsync(1001);
        expect(resetTrack).toHaveBeenCalledTimes(2);

        unmount();
    });

    it('limits automatic resets at MAX_RESET_ATTEMPTS (3)', async () => {
        const publication = createPublication('track-1');
        const getTracksToMonitor = vi.fn(() => [publication]);
        const checkTrackStats = vi.fn().mockResolvedValue({ currentValue: 0, isStuck: true });
        const resetTrack = vi.fn().mockResolvedValue(undefined);

        const { unmount } = renderHook(() =>
            useStuckTrackMonitor({
                checkIntervalMs: 1000,
                minExpectedDelta: 1,
                getTracksToMonitor,
                checkTrackStats,
                resetTrack,
            })
        );

        await vi.advanceTimersByTimeAsync(9000);

        expect(resetTrack).toHaveBeenCalledTimes(3);

        unmount();
    });
});
