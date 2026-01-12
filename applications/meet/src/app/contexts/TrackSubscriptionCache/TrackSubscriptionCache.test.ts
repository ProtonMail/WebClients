import { waitFor } from '@testing-library/react';
import { Track } from 'livekit-client';
import { describe, expect, it, vi } from 'vitest';

import { createPublication } from '../../utils/track-test-utils';
import { TrackSubscriptionCache } from './TrackSubscriptionCache';

vi.mock('@proton/shared/lib/helpers/promise', () => ({
    wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
}));

// Create a concrete implementation for testing the abstract class
class TestTrackSubscriptionCache extends TrackSubscriptionCache {
    protected getTrackSource(): Track.Source {
        return Track.Source.Camera;
    }
}

describe('TrackSubscriptionCache', () => {
    it('register() should subscribe and enable the track', async () => {
        const cache = new TestTrackSubscriptionCache(10);

        const pub = createPublication('track-1', Track.Source.Camera);
        const setSubscribedSpy = vi.spyOn(pub, 'setSubscribed');
        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');

        cache.register(pub, 'p1');

        await waitFor(() => {
            expect(setSubscribedSpy).toHaveBeenCalledWith(true);
            expect(pub.isSubscribed).toBe(true);

            expect(setEnabledSpy).toHaveBeenCalledWith(true);
            expect(pub.isEnabled).toBe(true);
        });
    });

    it('register() should ignore publications with wrong source', () => {
        const cache = new TestTrackSubscriptionCache(10);

        const pub = createPublication('track-1', Track.Source.Microphone);
        const setSubscribedSpy = vi.spyOn(pub, 'setSubscribed');

        cache.register(pub, 'p1');

        expect(setSubscribedSpy).not.toHaveBeenCalled();
    });

    it('register() should update existing entry when re-registering the same track', async () => {
        const cache = new TestTrackSubscriptionCache(10);

        const pub1 = createPublication('track-1', Track.Source.Camera);
        cache.register(pub1, 'p1');

        await waitFor(() => {
            expect(pub1.isSubscribed).toBe(true);
        });

        const pub2 = createPublication('track-1', Track.Source.Camera);
        const setSubscribedSpy = vi.spyOn(pub2, 'setSubscribed');
        cache.register(pub2, 'p2');

        await waitFor(() => {
            expect(setSubscribedSpy).toHaveBeenCalledWith(true);
            expect(pub2.isSubscribed).toBe(true);
        });
    });

    it('unregister() should disable the track if it is subscribed', async () => {
        const cache = new TestTrackSubscriptionCache(10);

        const pub = createPublication('track-1', Track.Source.Camera, { track: {} });
        cache.register(pub, 'p1');
        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
            expect(pub.isEnabled).toBe(true);
        });

        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');
        cache.unregister(pub);

        await waitFor(() => {
            expect(setEnabledSpy).toHaveBeenCalledWith(false);
            expect(pub.isEnabled).toBe(false);
        });
    });

    it('unregister() should not disable the track if it is not subscribed', async () => {
        const cache = new TestTrackSubscriptionCache(10);

        const pub = createPublication('track-1', Track.Source.Camera);
        cache.register(pub, 'p1');

        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
        });

        // Manually unsubscribe
        pub.setSubscribed(false);

        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');
        cache.unregister(pub);

        // Give it time to potentially call setEnabled
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(setEnabledSpy).not.toHaveBeenCalled();
    });

    it('should evict least-recently-used unpinned entries when capacity is exceeded', async () => {
        const cache = new TestTrackSubscriptionCache(1);

        // Register and unregister first track (unpinned, stays in cache)
        const pub1 = createPublication('track-1', Track.Source.Camera);
        const pub1SetSubscribedSpy = vi.spyOn(pub1, 'setSubscribed');
        cache.register(pub1, 'p1');
        await waitFor(() => {
            expect(pub1.isSubscribed).toBe(true);
        });

        cache.unregister(pub1);
        await waitFor(() => {
            expect(pub1.isEnabled).toBe(false);
        });

        // Register second track - should immediately evict first track
        const pub2 = createPublication('track-2', Track.Source.Camera);
        cache.register(pub2, 'p2');
        await waitFor(() => {
            expect(pub2.isSubscribed).toBe(true);
            // pub1 should be evicted and unsubscribed
            expect(pub1SetSubscribedSpy).toHaveBeenCalledWith(false);
            expect(pub1.isSubscribed).toBe(false);
        });
    });

    it('handleTrackUnpublished() should remove the track from the cache', async () => {
        const cache = new TestTrackSubscriptionCache(10);

        const pub = createPublication('track-1', Track.Source.Camera);
        cache.register(pub, 'p1');
        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
        });

        cache.handleTrackUnpublished(pub);

        // Re-registering should behave as a new registration
        // Reset the publication state to simulate a fresh track
        pub.setSubscribed(false);
        pub.setEnabled(false);
        const setSubscribedSpy = vi.spyOn(pub, 'setSubscribed');
        cache.register(pub, 'p1');
        await waitFor(() => {
            expect(setSubscribedSpy).toHaveBeenCalledWith(true);
        });
    });

    it('getQueueManagedTracksToMonitor() should return only subscribed+enabled+unmuted tracks with track object', async () => {
        const cache = new TestTrackSubscriptionCache(10);

        const good = createPublication('good', Track.Source.Camera);
        const noTrack = createPublication('no-track', Track.Source.Camera);
        const muted = createPublication('muted', Track.Source.Camera);
        const disabled = createPublication('disabled', Track.Source.Camera);
        const noParticipant = createPublication('no-participant', Track.Source.Camera);

        cache.register(good, 'p-good');
        cache.register(noTrack, 'p-no-track');
        cache.register(muted, 'p-muted');
        cache.register(disabled, 'p-disabled');
        cache.register(noParticipant);

        await waitFor(() => {
            expect(good.isSubscribed).toBe(true);
            expect(noTrack.isSubscribed).toBe(true);
            expect(muted.isSubscribed).toBe(true);
            expect(disabled.isSubscribed).toBe(true);
        });

        // @ts-expect-error - we're mocking the track object
        good.track = {};
        // noTrack has no track object
        // @ts-expect-error - we're mocking the track object
        muted.track = {};
        // @ts-expect-error - we're mocking the track object
        muted.isMuted = true;
        // @ts-expect-error - we're mocking the track object
        disabled.track = {};
        disabled.setEnabled(false);
        // @ts-expect-error - we're mocking the track object
        noParticipant.track = {};

        const monitored = cache.getQueueManagedTracksToMonitor();
        const sids = monitored.map((p) => p.trackSid).sort();
        expect(sids).toEqual(['good']);
    });

    it('resetQueueManagedTrack() should toggle off then restore subscription', async () => {
        const cache = new TestTrackSubscriptionCache(10);

        const pub = createPublication('track-1', Track.Source.Camera);
        const setSubscribedSpy = vi.spyOn(pub, 'setSubscribed');
        cache.register(pub, 'p1');
        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
            expect(pub.isEnabled).toBe(true);
        });

        await cache.resetQueueManagedTrack(pub);
        await waitFor(() => {
            expect(setSubscribedSpy).toHaveBeenCalledWith(false);
            expect(pub.isSubscribed).toBe(true);
            expect(pub.isEnabled).toBe(true);
        });
    });

    it('destroy() should disable and unsubscribe all tracks', async () => {
        const cache = new TestTrackSubscriptionCache(10);

        const pub1 = createPublication('track-1', Track.Source.Camera);
        const pub2 = createPublication('track-2', Track.Source.Camera);

        const setEnabled1Spy = vi.spyOn(pub1, 'setEnabled');
        const setSubscribed1Spy = vi.spyOn(pub1, 'setSubscribed');
        const setEnabled2Spy = vi.spyOn(pub2, 'setEnabled');
        const setSubscribed2Spy = vi.spyOn(pub2, 'setSubscribed');

        cache.register(pub1, 'p1');
        cache.register(pub2, 'p2');

        await waitFor(() => {
            expect(pub1.isSubscribed).toBe(true);
            expect(pub2.isSubscribed).toBe(true);
        });

        cache.destroy();

        expect(setEnabled1Spy).toHaveBeenCalledWith(false);
        expect(setSubscribed1Spy).toHaveBeenCalledWith(false);
        expect(setEnabled2Spy).toHaveBeenCalledWith(false);
        expect(setSubscribed2Spy).toHaveBeenCalledWith(false);
    });

    it('destroy() should clear all internal state', async () => {
        const cache = new TestTrackSubscriptionCache(10);

        const pub = createPublication('track-1', Track.Source.Camera);
        cache.register(pub, 'p1');

        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
        });

        cache.destroy();

        // After destroy, getQueueManagedTracksToMonitor should return empty
        const monitored = cache.getQueueManagedTracksToMonitor();
        expect(monitored).toEqual([]);
    });

    it('should enforce cooldown period when resubscribing to a track', async () => {
        const cache = new TestTrackSubscriptionCache(1); // Capacity of 1 to trigger eviction

        const pub1 = createPublication('track-1', Track.Source.Camera);
        const pub2 = createPublication('track-2', Track.Source.Camera);

        cache.register(pub1, 'p1');
        await waitFor(() => {
            expect(pub1.isSubscribed).toBe(true);
        });

        cache.unregister(pub1);
        await waitFor(() => {
            expect(pub1.isEnabled).toBe(false);
        });

        vi.useFakeTimers({ now: 1000 });

        cache.register(pub2, 'p2');
        await vi.runAllTimersAsync();

        expect(pub1.isSubscribed).toBe(false);

        cache.register(pub1, 'p1');

        // The track should only be subscribed after the cooldown period

        await vi.advanceTimersByTimeAsync(100);

        expect(pub1.isSubscribed).toBe(false);

        await vi.advanceTimersByTimeAsync(400);

        expect(pub1.isSubscribed).toBe(true);

        vi.useRealTimers();
    });
});
