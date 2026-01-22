import { waitFor } from '@testing-library/react';
import type { Room } from 'livekit-client';
import { ConnectionState, RemoteTrackPublication, Track, VideoQuality } from 'livekit-client';
import { describe, expect, it, vi } from 'vitest';

import { CameraTrackSubscriptionManager } from './CameraTrackSubscriptionManager';

vi.mock('@proton/shared/lib/helpers/promise', () => ({
    wait: () => Promise.resolve(),
}));

const defineWritable = (obj: any, key: string, value: any) => {
    Object.defineProperty(obj, key, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
    });
};

const mockRoom = {
    state: ConnectionState.Connected,
} as Room;

const createCameraPublication = (trackSid: string, overrides: Partial<Record<string, any>> = {}) => {
    const pub = Object.create(RemoteTrackPublication.prototype) as any;

    defineWritable(pub, 'source', Track.Source.Camera);
    defineWritable(pub, 'trackSid', trackSid);
    defineWritable(pub, 'isSubscribed', false);
    defineWritable(pub, 'isEnabled', false);
    defineWritable(pub, 'videoQuality', VideoQuality.HIGH);
    defineWritable(pub, 'track', undefined);
    defineWritable(pub, 'isMuted', false);

    pub.setSubscribed = (value: boolean) => {
        pub.isSubscribed = value;
    };
    pub.setEnabled = (value: boolean) => {
        pub.isEnabled = value;
    };
    pub.setVideoQuality = (quality: any) => {
        pub.videoQuality = quality;
    };

    Object.assign(pub, overrides);
    return pub as RemoteTrackPublication;
};

describe('CameraTrackSubscriptionCache', () => {
    it('register() should subscribe, enable, and apply quality based on policy', async () => {
        const manager = new CameraTrackSubscriptionManager(10, mockRoom);
        manager.setPolicy({
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

        manager.register(pub, 'p1');

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
        const manager = new CameraTrackSubscriptionManager(10, mockRoom);

        const pub = createCameraPublication('track-1');
        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');
        const setVideoQualitySpy = vi.spyOn(pub, 'setVideoQuality');
        manager.register(pub, 'p1');
        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
        });

        manager.setPolicy({
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

        manager.setPolicy({
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
        const manager = new CameraTrackSubscriptionManager(10, mockRoom);

        const pub = createCameraPublication('track-1', { track: {} });
        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');
        manager.register(pub, 'p1');
        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
            expect(pub.isEnabled).toBe(true);
        });

        manager.unregister(pub);
        await waitFor(() => {
            expect(setEnabledSpy).toHaveBeenCalledWith(false);
            expect(pub.isEnabled).toBe(false);
            expect(pub.isSubscribed).toBe(true);
        });
    });

    it('should evict least-recently-used unpinned entries and unsubscribe them during cleanup', async () => {
        const manager = new CameraTrackSubscriptionManager(1, mockRoom);

        const pub1 = createCameraPublication('track-1');
        const pub1SetSubscribedSpy = vi.spyOn(pub1, 'setSubscribed');
        manager.register(pub1, 'p1');
        await waitFor(() => {
            expect(pub1.isSubscribed).toBe(true);
        });
        manager.unregister(pub1);
        await waitFor(() => {
            expect(pub1.isEnabled).toBe(false);
        });

        const pub2 = createCameraPublication('track-2');
        manager.register(pub2, 'p2');
        await waitFor(() => {
            expect(pub2.isSubscribed).toBe(true);
        });
        manager.unregister(pub2);
        await waitFor(() => {
            expect(pub1SetSubscribedSpy).toHaveBeenCalledWith(false);
            expect(pub1.isSubscribed).toBe(false);
        });
    });

    it('resetQueueManagedVideoTrack() should toggle off then restore subscription based on current policy', async () => {
        const manager = new CameraTrackSubscriptionManager(10, mockRoom);
        manager.setPolicy({
            disableVideos: false,
            participantsWithDisabledVideos: [],
            participantQuality: VideoQuality.MEDIUM,
        });

        const pub = createCameraPublication('track-1');
        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');
        const setSubscribedSpy = vi.spyOn(pub, 'setSubscribed');
        manager.register(pub, 'p1');
        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
            expect(pub.isEnabled).toBe(true);
        });

        await manager.resetQueueManagedVideoTrack(pub);
        await waitFor(() => {
            expect(setEnabledSpy).toHaveBeenCalledWith(false);
            expect(setSubscribedSpy).toHaveBeenCalledWith(false);

            expect(pub.isSubscribed).toBe(true);
            expect(pub.isEnabled).toBe(true);
            expect(pub.videoQuality).toBe(VideoQuality.MEDIUM);
        });
    });

    it('should reconcile camera tracks when subscriptions were missed or lost', async () => {
        const manager = new CameraTrackSubscriptionManager(10, mockRoom);

        const pub1 = createCameraPublication('track-1');
        const pub1SetSubscribedSpy = vi.spyOn(pub1, 'setSubscribed');
        const pub1SetEnabledSpy = vi.spyOn(pub1, 'setEnabled');

        const pub2 = createCameraPublication('track-2');
        const pub2SetSubscribedSpy = vi.spyOn(pub2, 'setSubscribed');
        const pub2SetEnabledSpy = vi.spyOn(pub2, 'setEnabled');

        // Register both publications
        manager.register(pub1, 'p1');
        manager.register(pub2, 'p2');

        await waitFor(() => {
            expect(pub1.isSubscribed).toBe(true);
            expect(pub2.isSubscribed).toBe(true);
        });

        // Simulate subscription loss (e.g., network issue)
        defineWritable(pub1, 'isSubscribed', false);
        defineWritable(pub1, 'isEnabled', false);
        pub1SetSubscribedSpy.mockClear();
        pub1SetEnabledSpy.mockClear();

        // pub2 remains subscribed, so it should not be touched by reconcile
        pub2SetSubscribedSpy.mockClear();
        pub2SetEnabledSpy.mockClear();

        // Call reconcile to recover lost subscriptions
        manager.reconcileCameraTracks();

        // pub1 should be re-subscribed and re-enabled
        await waitFor(() => {
            expect(pub1SetSubscribedSpy).toHaveBeenCalledWith(true);
            expect(pub1SetEnabledSpy).toHaveBeenCalledWith(true);
            expect(pub1.isSubscribed).toBe(true);
            expect(pub1.isEnabled).toBe(true);
        });

        // pub2 should not be touched since it was already subscribed
        expect(pub2SetSubscribedSpy).not.toHaveBeenCalled();
        expect(pub2SetEnabledSpy).not.toHaveBeenCalled();
    });

    it('should not reconcile camera tracks when room is not connected', () => {
        const disconnectedRoom = {
            state: ConnectionState.Disconnected,
        } as Room;
        const manager = new CameraTrackSubscriptionManager(10, disconnectedRoom);

        const pub = createCameraPublication('track-1');
        const setSubscribedSpy = vi.spyOn(pub, 'setSubscribed');
        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');

        manager.register(pub, 'p1');

        // Simulate subscription loss
        defineWritable(pub, 'isSubscribed', false);
        defineWritable(pub, 'isEnabled', false);
        setSubscribedSpy.mockClear();
        setEnabledSpy.mockClear();

        // Call reconcile - should do nothing since room is not connected
        manager.reconcileCameraTracks();

        // Track should remain unsubscribed since reconcile shouldn't run
        expect(setSubscribedSpy).not.toHaveBeenCalled();
        expect(setEnabledSpy).not.toHaveBeenCalled();
        expect(pub.isSubscribed).toBe(false);
        expect(pub.isEnabled).toBe(false);
    });
});
