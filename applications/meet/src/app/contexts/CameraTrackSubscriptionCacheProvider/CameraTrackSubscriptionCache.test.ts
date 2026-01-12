import { waitFor } from '@testing-library/react';
import { VideoQuality } from 'livekit-client';
import { describe, expect, it, vi } from 'vitest';

import { createCameraPublication } from '../../utils/track-test-utils';
import { CameraTrackSubscriptionCache } from './CameraTrackSubscriptionCache';

vi.mock('@proton/shared/lib/helpers/promise', () => ({
    wait: () => Promise.resolve(),
}));

describe('CameraTrackSubscriptionCache', () => {
    it('register() should subscribe, enable, and apply quality based on policy', async () => {
        const cache = new CameraTrackSubscriptionCache(10);
        cache.setPolicy({
            disableVideos: false,
            participantsWithDisabledVideos: [],
            participantQuality: VideoQuality.MEDIUM,
        });

        const pub = createCameraPublication('track-1', {
            isSubscribed: false,
            isEnabled: false,
            videoQuality: VideoQuality.HIGH,
        });

        const setSubscribedSpy = vi.spyOn(pub, 'setSubscribed');
        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');
        const setVideoQualitySpy = vi.spyOn(pub, 'setVideoQuality');

        cache.register(pub, 'p1');

        await waitFor(() => {
            expect(setSubscribedSpy).toHaveBeenCalledWith(true);
            expect(pub.isSubscribed).toBe(true);

            expect(setEnabledSpy).toHaveBeenCalledWith(true);
            expect(pub.isEnabled).toBe(true);

            expect(setVideoQualitySpy).toHaveBeenCalledWith(VideoQuality.MEDIUM);
            expect(pub.videoQuality).toBe(VideoQuality.MEDIUM);
        });
    });

    it('setPolicy() should re-apply enabled state and quality for pinned tracks', async () => {
        const cache = new CameraTrackSubscriptionCache(10);

        const pub = createCameraPublication('track-1');
        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');
        const setVideoQualitySpy = vi.spyOn(pub, 'setVideoQuality');
        cache.register(pub, 'p1');
        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
        });

        cache.setPolicy({
            disableVideos: true,
            participantsWithDisabledVideos: [],
            participantQuality: VideoQuality.MEDIUM,
        });
        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
            expect(setEnabledSpy).toHaveBeenLastCalledWith(false);
            expect(pub.isEnabled).toBe(false);

            expect(pub.videoQuality).toBe(VideoQuality.HIGH);
        });

        cache.setPolicy({
            disableVideos: false,
            participantsWithDisabledVideos: [],
            participantQuality: VideoQuality.MEDIUM,
        });
        await waitFor(() => {
            expect(setEnabledSpy).toHaveBeenLastCalledWith(true);
            expect(pub.isEnabled).toBe(true);
            expect(setVideoQualitySpy).toHaveBeenCalledWith(VideoQuality.MEDIUM);
            expect(pub.videoQuality).toBe(VideoQuality.MEDIUM);
        });
    });

    it('unregister() should disable the publication if it is subscribed', async () => {
        const cache = new CameraTrackSubscriptionCache(10);

        const pub = createCameraPublication('track-1', { track: {} });
        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');
        cache.register(pub, 'p1');
        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
            expect(pub.isEnabled).toBe(true);
        });

        cache.unregister(pub);
        await waitFor(() => {
            expect(setEnabledSpy).toHaveBeenCalledWith(false);
            expect(pub.isEnabled).toBe(false);
            expect(pub.isSubscribed).toBe(true);
        });
    });

    it('should evict least-recently-used unpinned entries and unsubscribe them during cleanup', async () => {
        const cache = new CameraTrackSubscriptionCache(1);

        const pub1 = createCameraPublication('track-1');
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
        const pub2 = createCameraPublication('track-2');
        cache.register(pub2, 'p2');
        await waitFor(() => {
            expect(pub2.isSubscribed).toBe(true);
            // pub1 should be evicted and unsubscribed
            expect(pub1SetSubscribedSpy).toHaveBeenCalledWith(false);
            expect(pub1.isSubscribed).toBe(false);
        });
    });

    it('resetQueueManagedVideoTrack() should toggle off then restore subscription based on current policy', async () => {
        const cache = new CameraTrackSubscriptionCache(10);
        cache.setPolicy({
            disableVideos: false,
            participantsWithDisabledVideos: [],
            participantQuality: VideoQuality.MEDIUM,
        });

        const pub = createCameraPublication('track-1');
        const setSubscribedSpy = vi.spyOn(pub, 'setSubscribed');
        cache.register(pub, 'p1');
        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
            expect(pub.isEnabled).toBe(true);
        });

        await cache.resetQueueManagedVideoTrack(pub);
        await waitFor(() => {
            expect(setSubscribedSpy).toHaveBeenCalledWith(false);

            expect(pub.isSubscribed).toBe(true);
            expect(pub.isEnabled).toBe(true);
            expect(pub.videoQuality).toBe(VideoQuality.MEDIUM);
        });
    });

    it('getQueueManagedTracksToMonitor() should return only subscribed+enabled+unmuted tracks with participantIdentity and a track object', async () => {
        const cache = new CameraTrackSubscriptionCache(10);

        const good = createCameraPublication('good');
        const noTrack = createCameraPublication('no-track');
        const muted = createCameraPublication('muted');
        const disabled = createCameraPublication('disabled');

        cache.register(good, 'p-good');
        cache.register(noTrack, 'p-no-track');
        cache.register(muted, 'p-muted');
        cache.register(disabled, 'p-disabled');
        await waitFor(() => {
            expect(good.isSubscribed).toBe(true);
            expect(muted.isSubscribed).toBe(true);
            expect(disabled.isSubscribed).toBe(true);
        });

        // @ts-expect-error - we're mocking the track object
        good.track = {};
        // @ts-expect-error - we're mocking the track object
        muted.track = {};
        // @ts-expect-error - we're mocking the track object
        muted.isMuted = true;
        // @ts-expect-error - we're mocking the track object
        disabled.track = {};

        cache.setPolicy({
            disableVideos: false,
            participantsWithDisabledVideos: ['p-disabled'],
            participantQuality: undefined,
        });
        await waitFor(() => {
            const monitored = cache.getQueueManagedTracksToMonitor();
            const sids = monitored.map((p) => p.trackSid).sort();
            expect(sids).toEqual(['good']);
        });
    });
});
