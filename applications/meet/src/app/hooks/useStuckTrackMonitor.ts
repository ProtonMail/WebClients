import { useCallback, useEffect, useRef } from 'react';

import type { RemoteTrackPublication } from 'livekit-client';

import { wait } from '@proton/shared/lib/helpers/promise';

const MAX_RESET_ATTEMPTS = 3;
const MAX_RESET_BACKOFF_MS = 60_000;
const PRE_RESET_JITTER_MS = 1000;

interface TrackStats {
    lastValue: number;
    lastConcealedSamples: number;
    resetAttempts: number;
    isResetting: boolean;
    nextAllowedResetAt: number;
}

interface StuckCheckResult {
    isStuck: boolean;
    currentValue: number;
    minExpectedDelta?: number;
    concealedSamples?: number;
    maxConcealedSamplesDelta?: number;
}

interface UseStuckTrackMonitorParams {
    checkIntervalMs: number;
    minExpectedDelta: number;
    getTracksToMonitor: () => RemoteTrackPublication[];
    checkTrackStats: (publication: RemoteTrackPublication) => Promise<StuckCheckResult | null>;
    resetTrack?: (publication: RemoteTrackPublication) => Promise<void>;
}

export const useStuckTrackMonitor = ({
    checkIntervalMs,
    minExpectedDelta,
    getTracksToMonitor,
    checkTrackStats,
    resetTrack,
}: UseStuckTrackMonitorParams) => {
    const statsRef = useRef<Map<string, TrackStats>>(new Map());
    const stuckCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const defaultResetTrack = async (publication: RemoteTrackPublication) => {
        // Check if publication is still valid before starting
        if (!publication.track) {
            return;
        }

        publication.setEnabled(false);
        await wait(100);

        // Check if publication is still valid before continuing
        if (!publication.track) {
            return;
        }

        publication.setSubscribed(false);
        await wait(100);

        try {
            publication.setSubscribed(true);
        } catch {
            // eslint-disable-next-line no-console
            console.error('Error resetting track', publication.trackSid);
            return;
        }
    };

    const resetStuckTrack = async (publication: RemoteTrackPublication, trackSid: string) => {
        const stats = statsRef.current.get(trackSid);
        if (!stats || stats.isResetting || stats.resetAttempts >= MAX_RESET_ATTEMPTS) {
            return;
        }

        const now = Date.now();
        if (now < stats.nextAllowedResetAt) {
            return;
        }

        stats.resetAttempts += 1;
        stats.isResetting = true;
        const exponential = Math.min(
            MAX_RESET_BACKOFF_MS,
            checkIntervalMs * Math.pow(2, Math.max(0, stats.resetAttempts - 1))
        );
        stats.nextAllowedResetAt = now + exponential;

        try {
            // Adding a small random jitter to avoid concurrent high load
            await wait(Math.floor(Math.random() * PRE_RESET_JITTER_MS));
            if (resetTrack) {
                await resetTrack(publication);
            } else {
                await defaultResetTrack(publication);
            }

            stats.lastValue = 0;
            stats.lastConcealedSamples = 0;
        } catch {
        } finally {
            stats.isResetting = false;
        }
    };

    const checkTracksStuck = useCallback(async () => {
        const tracksToCheck = getTracksToMonitor();
        const activeTrackSids = new Set(tracksToCheck.map((p) => p.trackSid));

        for (const publication of tracksToCheck) {
            const trackSid = publication.trackSid;

            if (!statsRef.current.has(trackSid)) {
                statsRef.current.set(trackSid, {
                    lastValue: 0,
                    lastConcealedSamples: 0,
                    resetAttempts: 0,
                    isResetting: false,
                    nextAllowedResetAt: 0,
                });
            }

            const stats = statsRef.current.get(trackSid)!;
            if (stats.isResetting) {
                continue;
            }

            try {
                const result = await checkTrackStats(publication);
                if (!result) {
                    continue;
                }

                const { currentValue, isStuck, concealedSamples, maxConcealedSamplesDelta } = result;
                const expectedDelta = result.minExpectedDelta ?? minExpectedDelta;

                const delta = currentValue - stats.lastValue;

                if (delta < 0) {
                    stats.lastValue = currentValue;
                    continue;
                }

                // Check for concealed samples spike
                const concealedSamplesDelta =
                    concealedSamples !== undefined ? concealedSamples - stats.lastConcealedSamples : 0;
                const hasConcealedSamplesIssue =
                    maxConcealedSamplesDelta !== undefined &&
                    concealedSamplesDelta > 0 &&
                    concealedSamplesDelta >= maxConcealedSamplesDelta;

                if (delta >= expectedDelta && stats.resetAttempts > 0) {
                    stats.resetAttempts = 0;
                }

                const badThisInterval =
                    isStuck || (expectedDelta > 0 && delta < expectedDelta) || hasConcealedSamplesIssue;
                if (badThisInterval) {
                    await resetStuckTrack(publication, trackSid);
                    continue;
                }

                stats.lastValue = currentValue;
                if (concealedSamples !== undefined) {
                    stats.lastConcealedSamples = concealedSamples;
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error checking track stats', error);
            }
        }

        // Prune stats for tracks we no longer monitor to avoid unbounded growth.
        for (const sid of statsRef.current.keys()) {
            if (!activeTrackSids.has(sid)) {
                statsRef.current.delete(sid);
            }
        }
    }, [checkTrackStats, getTracksToMonitor, minExpectedDelta, resetTrack, checkIntervalMs]);

    useEffect(() => {
        stuckCheckIntervalRef.current = setInterval(() => {
            void checkTracksStuck();
        }, checkIntervalMs);

        return () => {
            if (stuckCheckIntervalRef.current) {
                clearInterval(stuckCheckIntervalRef.current);
            }
        };
    }, [checkTracksStuck, checkIntervalMs]);
};
